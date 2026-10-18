# AWS deployment and rollback

## One-time setup

1. Install Terraform 1.7+ and configure an AWS identity with permissions to create the resources in `infra/aws/`.
2. Create the GitHub Environments `staging` and `production`; require reviewers for `production`.
3. From `infra/aws/`, copy `terraform.tfvars.example`, set `environment = "staging"`, then run `terraform init`, `terraform plan` and review the plan. Do not apply production resources before approval.
4. After a successful apply, set environment-scoped GitHub variables: `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `AWS_WEB_BUCKET`, `AWS_CLOUDFRONT_DISTRIBUTION_ID`, and `AWS_CLOUDFRONT_DOMAIN`.
5. Confirm the SNS subscription if alerting is configured.

## Staging deployment

`Deploy AWS staging` validates lint, TypeScript, tests and an AWS-style shell build. It uploads only `public/` runtime assets and `dist/` app output. It never uploads `datasets/`, `.env`, Android signing files or Supabase data. It writes a checksummed runtime manifest and runs read-only CloudFront smoke checks.

## Rollback

1. Stop promotion and record the bad commit and CloudFront invalidation ID.
2. Re-run the protected deployment workflow with the last verified commit SHA.
3. Restore changed dataset paths from their previous S3 object version or from that release's manifest; invalidate only the restored prefix.
4. Verify the six smoke endpoints and country viewport checks.
5. If AWS remains unhealthy, direct users to the unchanged GitHub Pages URL. Do not delete the AWS bucket or GitHub Pages branch during incident recovery.

S3 versioning retains prior objects for 90 days. This is a recoverable release mechanism, not a substitute for Supabase backups; review the actual Supabase plan and backup controls separately.
