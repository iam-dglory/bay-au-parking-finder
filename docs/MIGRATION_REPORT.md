# AWS migration report — preparation only

Date: 19 October 2026

## Completed

- Audited frontend, Capacitor projects, Supabase migrations, runtime data loaders, public pages, dataset source tree and deployment history.
- Created dedicated branch `infra/aws-migration-20261019`.
- Added environment-based static-asset URL handling so the same application can use CloudFront without hardcoded GitHub Pages paths.
- Added Terraform for a private, versioned S3 origin, CloudFront OAC distribution, security headers, optional alerting/budget controls and GitHub OIDC deployment role.
- Added CI, staging, production and isolated dataset deployment workflows.
- Added checksummed runtime manifest and CloudFront smoke-test scripts.
- Added architecture, migration, dataset, deployment, security, operations and cost documentation.

## Not completed — deliberately pending

No AWS resources have been created, no datasets copied, no DNS changed, no GitHub Pages service disabled, no Supabase migration performed and no Android release published. AWS credentials, account ID, operator confirmation and a paid-resource approval are not available in this workspace.

## Verification still required after staging exists

- Terraform plan/apply output and IAM policy review.
- Object-by-object checksum/record/schema comparison.
- CloudFront staging smoke tests.
- Browser and mobile tests for AU, India and US; Melbourne sensor rules; search, filters, location, directions, activity, guide, feedback and auth.
- Exact signed Android release candidate compatibility test.
- Operations alert and S3-version restoration drill.

## Rollback status

GitHub Pages remains the active public service and is the immediate fallback. Terraform is additive. S3 versioning is configured in code; it cannot protect data until the approved staging apply has run.
