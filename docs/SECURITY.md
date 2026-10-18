# Bay AWS security controls

- The S3 origin has all public access blocks enabled, bucket-owner enforced object ownership, SSE-S3 encryption and versioning.
- CloudFront reaches S3 only through Origin Access Control. Browser clients never receive S3 credentials.
- GitHub Actions authenticates through short-lived OIDC tokens. The deployment role is restricted to this repository's named GitHub environment and only has S3 upload/list/delete plus CloudFront invalidation permissions for its environment.
- `.env`, service-role keys, raw source archives, Android signing keys and user data are ignored and excluded from the deployment path.
- Supabase remains the identity/data boundary. Its Row Level Security and anonymous-auth design are not weakened by this migration. Service-role credentials must never enter Vite environment variables.
- CloudFront applies HTTPS redirect, HSTS, anti-framing, content-type, referrer and Permissions-Policy headers. The application must still accurately disclose its real location, camera, analytics and Supabase data handling in the privacy policy.
- Booking remains non-transactional unless an authorised provider integration, server-side validation, payment webhook verification and idempotency controls are implemented. The current client cannot create confirmed bookings.

Before production, enable GitHub secret scanning and dependency alerts, set required production reviewers, confirm the SNS alert destination and record a Supabase backup/restore procedure for the actual subscription plan.
