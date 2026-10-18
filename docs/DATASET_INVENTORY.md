# Bay dataset inventory

Audit date: 19 October 2026. “Runtime” means required by the browser or Capacitor bundle. “Source-only” means retained for reproducible imports and must never be placed in the public asset prefix without a licence and privacy review.

| Component | Existing location | Purpose / source | Size observed | Update cadence | AWS destination | Priority | Verification |
|---|---|---|---:|---|---|---|---|
| Melbourne runtime catalog | `public/data/melbourne/` | City of Melbourne parking bays, areas and indexes | Included in 221 MB runtime tree | Dataset release; live sensor status remains Supabase-fed | `/data/melbourne/` | P0 | SHA-256 manifest, index schema, nearby lookup smoke test |
| Australia national catalog | `public/data/australia/` | Reviewed OSM-derived regional parking tiles | Included in 221 MB runtime tree | Dataset release | `/data/australia/` | P0 | Manifest, gzip/schema check, AU viewport test |
| India national catalog | `public/data/india/` plus legacy `public/data/india-parking.json` | Reviewed India parking tiles and compatibility catalog | Included in 221 MB runtime tree | Dataset release | `/data/india/`, legacy file retained | P0 | Manifest, schema/record test, India viewport test |
| United States catalog | `public/data/usa/` | State/territory OSM-derived parking tiles and index | Included in 221 MB runtime tree | Dataset release | `/data/usa/` | P0 | Manifest, dedupe test, US viewport test |
| San Francisco meter catalog | `public/data/sf-meters/` | SFMTA meter locations; not a vacancy feed | Included in 221 MB runtime tree | Dataset release | `/data/sf-meters/` | P0 | Manifest, SF lookup and disclosure check |
| Application icons and logo | `public/icons/`, `public/logo/` | Bay brand assets | Small | On release | `/icons/`, `/logo/` | P0 | HTTP and visual smoke test |
| Landing/privacy/survey/waitlist pages | `public/*.html`, JS and CSS | Public legal and marketing pages | Small | On release | Root static paths | P0 | Link/API smoke test |
| Melbourne source extracts | `datasets/melbourne/`, `datasets/melbourne-city-of-melbourne/` | Council raw snapshots, restrictions, rate research and audits | ~155 MB | Per source/review | **Not uploaded in phase 1**; optional private archive prefix after licence review | P1 | File checksum + import record count |
| Brisbane source extracts | `datasets/brisbane-city-council/` | Council source snapshots | ~45 MB | Per source/review | **Not uploaded in phase 1** | P1 | File checksum + import record count |
| Australia source extracts | `datasets/australia/` | National processing inputs | ~943 MB | Dataset build | **Not uploaded in phase 1** | P1 | Checksum and output comparison |
| India source extracts | `datasets/india/` | National processing inputs; raw PBF paths are gitignored | ~1.7 GB | Dataset build | **Not uploaded in phase 1** | P1 | Checksum and output comparison |
| United States source extracts | `datasets/us/` | OSM/regulatory source snapshots; raw PBF paths are gitignored | ~5.1 GB | Dataset build | **Not uploaded in phase 1** | P1 | Checksum and output comparison |
| Research and audits | `datasets/research-*`, `docs/` | Audit evidence and planning | ~11 MB plus documents | Manual | Git only; never runtime | P2 | Git history |
| Supabase records | Supabase project `ezwiagssiuvmhayvsmbk` | Auth, user activity, feedback, photos, waitlist and backend queries | Not locally measurable | Live | Retained in Supabase | P0 | Existing RLS/RPC/API checks |

The deployable `public/data/` tree is approximately **221 MB**. Local `datasets/` is approximately **6.2 GB** on this workstation and includes source-only materials. It must not be blindly synchronized to a public bucket.

## Required checksum inventory

`scripts/aws/generate-dataset-manifest.mjs` produces an itemized SHA-256 manifest with path, byte size and content type. CI creates and uploads one for every data release under `/manifests/`; the manifest is the release record used for rollback and integrity verification.

```bash
node scripts/aws/generate-dataset-manifest.mjs public/data --output /tmp/bay-runtime-manifest.json
```

A migration is accepted only after the source manifest, uploaded object checksums, expected record counts and client lookups match. Live vacancy is never inferred from catalog records; it remains subject to the existing exact-bay and feed-freshness rules.
