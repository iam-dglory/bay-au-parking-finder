# Bay operations

## Monitoring

CloudWatch covers the AWS distribution's 5xx error rate. AWS Budgets provides forecast and actual-spend alerts when an operations email is configured. GitHub Actions provides build/deploy status. These controls do not automatically monitor Supabase client errors, upstream OSM/Nominatim availability or Melbourne's sensor feed; those need explicit service integrations if required.

## Dataset releases

1. Rebuild a reviewed runtime subset in `public/data/`; never publish raw input archives.
2. Run existing validation scripts and unit tests.
3. Generate a SHA-256 manifest.
4. Use the protected `Deploy parking datasets` workflow against staging.
5. Compare manifest, record count, schema, country viewport behaviour and source attribution.
6. Promote through the protected production environment only after review.

## Incident response

- **App shell failure:** roll back the previous verified commit; invalidate `/index.html` and changed `assets/*` only.
- **Dataset failure:** restore only the affected S3 prefix/version; invalidate that prefix; keep all other countries serving.
- **Supabase/sensor failure:** do not fabricate vacancy or permission. Keep catalog data, show source limitations, and investigate the backend/feed separately.
- **Cost alert:** identify CloudFront bytes/requests and S3 prefixes in Cost Explorer; reduce invalidations and large client downloads before adding new services.

## Backup checks

Quarterly, restore one prior S3 object version to a staging prefix, verify its checksum against the manifest and confirm a browser lookup. Record the result in the release log. Review Supabase backup/export capabilities at the plan level; no claim of database recovery is made without an executed restore test.
