# AWS migration plan

## Risk controls

| Risk | Control |
|---|---|
| Broken Android release | Keep GitHub Pages online. Test the signed release candidate against its existing bundled runtime before changing any URL. No Play publication is part of this migration. |
| Public exposure of private data or raw extracts | CI uploads only `public/` runtime assets. Local `datasets/`, `.env`, raw PBFs and Supabase records are excluded. |
| Dataset regression | Checksummed manifests, record/schema checks, viewport smoke tests and versioned S3 objects. |
| CDN cache serving stale critical UI | `index.html` is no-cache; Vite hashed files are immutable; dataset changes invalidate only their changed prefix. |
| Cost spike | S3/CloudFront are serverless; no EC2, RDS or Kubernetes. Optional budget alarms require a confirmed operations email. |
| DNS/cutover outage | Use the CloudFront hostname for staging first. Custom domain/DNS is separate and requires approval. |
| Supabase regression | Leave it in place; no schema, RLS or credential changes in phase 1. |

## Execution phases

1. **Complete (pre-provisioning):** repository and local-data audit, AWS Terraform, CI/CD workflow, environment-based public-asset URL support, backup/rollback documentation.
2. **Requires AWS approval/access:** create staging S3/CloudFront/IAM resources with `terraform apply`; configure GitHub Environment variables; confirm alert email subscription.
3. **Staging:** deploy to the CloudFront hostname, verify Australia, India, US, Melbourne sensor display rules, map, geolocation, directions, saved locations, activity, guide, feedback, anonymous auth and static legal pages. Validate desktop, mobile web and Android release candidate.
4. **Production readiness review:** compare manifests, capture deployment/test evidence, confirm GitHub Pages remains reachable, calculate real traffic estimate, review CloudFront billing and rollback.
5. **Explicit cutover only:** deploy a reviewed commit through the protected production GitHub environment. A custom domain/DNS change is a later approved action. Keep GitHub Pages until all released clients and links have been observed working.

## Missing access and decisions

- AWS account ID and delegated operator with Terraform permissions.
- Confirmed AWS region (the template proposes `ap-southeast-2`).
- An operations alert email and confirmation of the SNS subscription.
- GitHub Environments named `staging` and `production`, with required reviewers on production.
- Decision on a custom domain. No domain has been purchased or assumed.
- A permitted map-tile/geocoding strategy for growth. Existing OSM/Nominatim endpoints must not be mirrored or high-volume proxied without reviewing their usage policies.
- Licence review for any source-only extracts before a private archive bucket is considered.
