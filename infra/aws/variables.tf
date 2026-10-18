variable "aws_region" {
  type        = string
  description = "AWS region for S3, alarms and regional resources. CloudFront remains global."
  default     = "ap-southeast-2"
}

variable "project_slug" {
  type        = string
  description = "Lowercase DNS-safe project slug used in resource names."
  default     = "bay-parking"
}

variable "environment" {
  type        = string
  description = "Deployment environment, for example staging or production."
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "github_repository" {
  type        = string
  description = "GitHub repository allowed to assume the deployment role."
  default     = "iam-dglory/bay-au-parking-finder"
}

variable "production_branch" {
  type        = string
  description = "The only branch allowed to publish production after GitHub environment approval."
  default     = "main"
}

variable "alert_email" {
  type        = string
  description = "Optional operations email for CloudWatch and AWS Budget alerts. Leave null until confirmed."
  default     = null
  nullable    = true
}

variable "monthly_budget_usd" {
  type        = number
  description = "Monthly cost guardrail. This creates an alert only; it never stops the application."
  default     = 30
}

variable "create_github_oidc_provider" {
  type        = bool
  description = "Set false and import/reference an existing GitHub Actions OIDC provider if the AWS account already has one."
  default     = true
}
