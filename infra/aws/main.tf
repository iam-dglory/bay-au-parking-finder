data "aws_caller_identity" "current" {}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

locals {
  bucket_name = "${var.project_slug}-${var.environment}-${data.aws_caller_identity.current.account_id}"
  alerting    = var.alert_email != null && trim(var.alert_email) != ""
  oidc_url    = "https://token.actions.githubusercontent.com"
  github_sub  = var.environment == "production" ? "repo:${var.github_repository}:environment:production" : "repo:${var.github_repository}:environment:staging"
}

resource "aws_s3_bucket" "web" {
  bucket        = local.bucket_name
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "web" {
  bucket = aws_s3_bucket.web.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}

resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    id     = "retain-previous-releases"
    status = "Enabled"
    noncurrent_version_expiration { noncurrent_days = 90 }
    abort_incomplete_multipart_upload { days_after_initiation = 7 }
  }
}

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${var.project_slug}-${var.environment}-s3"
  description                       = "CloudFront-only access to Bay's private web bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${var.project_slug}-${var.environment}-security"
  security_headers_config {
    content_type_options { override = true }
    frame_options { frame_option = "DENY" override = true }
    referrer_policy { referrer_policy = "strict-origin-when-cross-origin" override = true }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection { protection = true mode_block = true override = true }
  }
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(self), camera=(self), payment=(), microphone=()"
      override = true
    }
  }
}

resource "aws_cloudfront_cache_policy" "runtime_data" {
  name        = "${var.project_slug}-${var.environment}-runtime-data"
  comment     = "Versioned data assets; invalidate only changed paths."
  min_ttl     = 0
  default_ttl = 86400
  max_ttl     = 2592000
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config { cookie_behavior = "none" }
    headers_config { header_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }
  }
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Bay ${var.environment} web and public parking runtime assets"
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = "bay-private-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  default_cache_behavior {
    target_origin_id       = "bay-private-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
    compress               = true
  }

  dynamic "ordered_cache_behavior" {
    for_each = toset(["data/*", "tiles/*", "catalogs/*", "manifests/*"])
    content {
      path_pattern             = ordered_cache_behavior.value
      target_origin_id         = "bay-private-s3"
      viewer_protocol_policy   = "redirect-to-https"
      allowed_methods          = ["GET", "HEAD", "OPTIONS"]
      cached_methods           = ["GET", "HEAD", "OPTIONS"]
      cache_policy_id          = aws_cloudfront_cache_policy.runtime_data.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
      compress                 = true
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudFrontReadOnly"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web.arn}/*"
      Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.web.arn } }
    }]
  })
}

resource "aws_sns_topic" "operations" {
  count = local.alerting ? 1 : 0
  name  = "${var.project_slug}-${var.environment}-operations"
}

resource "aws_sns_topic_subscription" "operations_email" {
  count     = local.alerting ? 1 : 0
  topic_arn = aws_sns_topic.operations[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  count               = local.alerting ? 1 : 0
  alarm_name          = "${var.project_slug}-${var.environment}-cloudfront-5xx"
  alarm_description   = "Bay CloudFront served five or more 5xx responses in five minutes."
  namespace           = "AWS/CloudFront"
  metric_name         = "5xxErrorRate"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  dimensions = { DistributionId = aws_cloudfront_distribution.web.id, Region = "Global" }
  alarm_actions = [aws_sns_topic.operations[0].arn]
}

resource "aws_budgets_budget" "monthly" {
  count        = local.alerting ? 1 : 0
  name         = "${var.project_slug}-${var.environment}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

resource "aws_iam_openid_connect_provider" "github" {
  count           = var.create_github_oidc_provider ? 1 : 0
  url             = local.oidc_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals { type = "Federated" identifiers = [try(aws_iam_openid_connect_provider.github[0].arn, "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com")] }
    condition { test = "StringEquals" variable = "token.actions.githubusercontent.com:aud" values = ["sts.amazonaws.com"] }
    condition { test = "StringEquals" variable = "token.actions.githubusercontent.com:sub" values = [local.github_sub] }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${var.project_slug}-${var.environment}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

resource "aws_iam_role_policy" "github_deploy" {
  name = "publish-web-and-runtime-assets"
  role = aws_iam_role.github_deploy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.web.arn },
      { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:AbortMultipartUpload"], Resource = "${aws_s3_bucket.web.arn}/*" },
      { Effect = "Allow", Action = ["cloudfront:CreateInvalidation"], Resource = aws_cloudfront_distribution.web.arn }
    ]
  })
}
