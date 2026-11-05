# BAY V2 launch readiness report

Prepared: 5 November 2026  
Repository branch: `infra/aws-migration-20261019`  
Decision: **Parking discovery is ready for internal Play validation; Marketplace V2 is internal-only and blocked from public transactions.**  
Change-control: all work in this report is local. Nothing was deployed, uploaded, published or pushed.

## A. Feature audit

Status meanings: **LIVE** = evidenced in the current public product; **READY FOR RELEASE** = implemented and locally verified but not deployed; **TESTING** = implemented but requires deployed/device evidence; **IN DEVELOPMENT** = incomplete; **BLOCKED** = cannot safely release without an external dependency; **NOT IMPLEMENTED** = absent or intentionally excluded.

| Feature | Status | Implemented | Tested | Deployed | Publicly available | Marketing-ready | Evidence / limit |
|---|---|---:|---:|---:|---:|---:|---|
| Destination/current-location search | LIVE | Yes | Yes | Yes | Yes | Yes | Current public discovery product; local regression suite passed |
| 500 m default and radius controls | READY FOR RELEASE | Yes | Yes | No evidence for this branch | No | Yes | Mobile capture and production build |
| Map/list discovery | LIVE | Yes | Yes | Yes | Yes | Yes | Actual UI screenshots; coverage varies by source |
| Parking-area/bay details | LIVE | Yes | Yes | Yes | Yes | Yes | Honest missing price/live-reading states retained |
| External directions | LIVE | Yes | Yes | Yes | Yes | Yes | User must review details before navigating |
| Saved home/work and activity | LIVE | Yes | Yes | Yes | Yes | Yes | Local activity UI verified; lifecycle still needs Android device test |
| Parking sign guide | LIVE | Yes | Yes | Yes | Yes | Yes | Actual guide screenshot included |
| Structured incorrect-information reporting | READY FOR RELEASE | Yes | UI/build only | No | No | Yes after deployment | Migration/RPC/RLS must be deployed and tested |
| Privacy-minimised product analytics | READY FOR RELEASE | Yes | Build/contract review | No | No | Internal only | Migration pending; no precise location or free text in event properties |
| Landing page and trackable Play links | READY FOR RELEASE | Yes | Desktop + 390 × 844 visual QA | No | No | Yes | Real app map, QR, privacy/terms/contact links |
| Google Play listing copy | READY FOR RELEASE | Yes | Character/policy review | No | No | Yes | Discovery-only, no unsupported claims |
| Seven Play screenshots | READY FOR RELEASE | Yes | File and visual QA | No | No | Yes | 780 × 1688 actual-app PNGs |
| Demo video | READY FOR PRODUCTION | Package only | Script/caption review | No | No | Yes after export | Storyboard, shot list, VO and captions supplied; no fake UI/video export |
| Social launch kit | READY FOR RELEASE | Yes | Messaging review | No | No | Yes | No accounts/posts changed |
| Marketplace host listing | TESTING | Yes | Build/unit-level | No proof | No | No | Default-off flag; staging, moderation and legal evidence missing |
| Verified geographic pricing zones | BLOCKED | Schema/policy | No authoritative data test | No | No | No | Authoritative licensed GeoJSON and verification workflow required |
| Marketplace Stripe Connect onboarding | BLOCKED | Code path | No end-to-end test | No proof | No | No | Test secrets, AU account, return URLs and restricted-account states unverified |
| Marketplace booking/payment confirmation | BLOCKED | Code path | No signed webhook test | No proof | No | No | Must prove paid webhook, idempotency and concurrency |
| Marketplace refunds/payouts/disputes | BLOCKED | Partial | No lifecycle test | No proof | No | No | Legal, operations, monitoring and reconciliation required |
| Public Marketplace navigation | NOT IMPLEMENTED by design | Gated | Public-off verified | No | No | No | Must remain off until every gate passes |

Public Play evidence available during the audit showed `10+ downloads`, not an authenticated exact install count. No complete-coverage, guaranteed-availability, guaranteed-price or 100%-accuracy claim is supported.

## B. Work completed

### Product and release controls

- Added a default-off Marketplace release flag and protected public navigation and My Activity queries/content.
- Added privacy-minimised analytics events and server RPC/migration design.
- Added structured parking-information reports with duplicate/rate-limit controls and a private screenshot bucket policy.
- Added correction entry points to parking area and bay detail views.
- Added verified-webhook booking analytics for the future Marketplace flow.
- Guarded parking-detail analytics against duplicate React re-render events.
- Updated privacy terms and added public terms.

### Verification

- Source lint: passed.
- TypeScript/production build: passed.
- Tests: 21 files and 100 tests passed.
- Landing page: visually verified on desktop and at 390 × 844.
- Mobile discovery: map, list, details, reporting, filters, guide and My Activity exercised with actual app UI.
- Android: signed `bundleRelease` passed with R8/resource shrinking; bundle signature, package, version and icon checked.

### Important build architecture

The Android shell build uses `VITE_SKIP_PUBLIC_COPY=true`. This prevents parking datasets from being embedded in every binary. Runtime data must be served from the configured versioned asset host and monitored independently. A normal build that copies the full public dataset tree is slow and recreates the oversized-app problem.

## C. Marketing deliverables

| Deliverable | Location | State |
|---|---|---|
| Google Play title, descriptions, release notes | `marketing/play-store/listing-copy.md` | Copy-ready |
| Plain release notes | `marketing/play-store/release-notes.txt` | Copy-ready |
| Seven actual-app screenshots | `marketing/play-store/screenshots/` | Ready for review/upload |
| Screenshot order/captions | `marketing/play-store/screenshots/README.md` | Ready |
| 20–30 second demo production package | `marketing/video/bay-demo-production-package.md` | Ready to film/edit |
| Timed captions | `marketing/video/bay-demo-captions.srt` | Ready |
| Landing page | `public/landing.html`, `public/landing.css` | Locally QA’d; not deployed |
| Play QR | `public/play-store-qr.png` | Verified rendering |
| Social launch kit | `marketing/social/november-launch-kit.md` | Ready for approval |

Store copy meets the documented 30-character title, 80-character short-description and 4,000-character full-description limits. Marketplace benefits are not presented as public.

## D. Analytics

Current baseline:

- Publicly observable Play listing: `10+ downloads`; exact installs, active users, retention and conversion were not available without authenticated Play Console access.
- Existing first-party data: Supabase search events and direction/visit history.
- New first-party contract: `first_open`, `parking_search`, `parking_result_view`, `directions_open`, `restriction_view`, `feedback_submitted`, plus gated Marketplace funnel events.
- Production state: the launch migration has **not** been applied, so the new dashboard is not operational.

Dashboard definition and privacy rules are in `docs/launch/analytics-dashboard-spec.md`. Google Play acquisition/vitals remain the source of truth for store acquisition and Android quality; BAY events explain product activation after install.

## E. Android release

| Item | Result |
|---|---|
| Application ID | `au.com.bayparking.app` |
| Current local version | `1.2.1` / `versionCode 4` |
| Target SDK | 36; compliant with the 2026 new-update target requirement |
| Signed bundle | `release/BAY-1.2.1-vc4.aab` |
| Size | Approximately 3.7 MB AAB |
| SHA-256 | `d4c3a6a643e96a757fe7bc6b7d91ed7b64e0d3ff6e23cc9de79d0ddb54b5e4af` |
| Signature | `jarsigner`: `jar verified`, exit 0; normal self-signed upload-key warnings |
| Optimisation | R8 minification and resource shrinking executed |
| Icon | Official BAY wordmark verified from packaged `xxxhdpi` launcher resource |

Release blockers:

1. Confirm whether Play has already consumed version code 4; every uploaded update needs an unused higher code.
2. Install from an internal Play track and complete physical-device lifecycle tests.
3. Apply/test the reporting and analytics migration before promising those features.
4. Run Play pre-launch report and inspect Android vitals.
5. Confirm production runtime asset availability and rollback pointer.

The signed AAB was built locally only. It was not uploaded.

## F. Marketplace V2

Decision: **READY FOR INTERNAL TESTING AFTER STAGING CONFIGURATION; NOT READY FOR CLOSED OR PRODUCTION TRANSACTIONS.**

The codebase has a substantial foundation—listing policy, moderation states, price validation, reservation holds, booking RPCs, Stripe Connect/checkout/refund paths, RLS and auditing—but no safe transaction launch can be claimed without:

- authoritative, licensed and verified Melbourne pricing-zone boundaries;
- a staging Supabase deployment and separate driver/host/moderator/attacker accounts;
- Stripe test-mode Connect, signed webhook, replay/idempotency, refund and payout evidence;
- concurrency tests proving no double booking;
- independent RLS abuse tests and private access-detail checks;
- Australian consumer, tax, strata/land-rights, privacy, insurance and host-liability review;
- alerting, reconciliation, incident, dispute and host-support runbooks.

The public flag remains false. Detailed gate: `docs/launch/marketplace-v2-release-gate-2026-11-05.md`.

## G. November marketing readiness

**Creative readiness: high. Operational readiness: conditional.** Copy, screenshots, landing page, social concepts and demo-production assets exist. A 1,000+ November acquisition goal can be measured from Play Console, but there is no historical conversion baseline to justify a forecast.

Before campaign launch:

1. Release the tested discovery build through the staged rollout.
2. Deploy the landing page and verify every UTM/referrer link.
3. Capture authenticated Play acquisition and conversion baselines.
4. Apply/verify first-party analytics so search-to-direction activation can be measured.
5. Assign daily owners for Android vitals, parking reports and social response.
6. Keep every Marketplace asset labelled internal preview/coming later.

## H. Next actions

| Priority | Action | Owner | Dependency | Expected deliverable | Verification |
|---|---|---|---|---|---|
| P0 | Check Play’s latest used version code and increment/rebuild if needed | Android release owner | Play Console access | Uploadable AAB with unused code | Play accepts artifact without conflict |
| P0 | Internal-track install/upgrade/device QA | QA + release owner | Accepted internal artifact | Signed device test record | Fresh/upgrade/permissions/resume/back/offline pass |
| P0 | Apply launch migration to staging | Backend owner | Staging Supabase access | Analytics/report tables, RPCs, storage policy | RLS/rate-limit/duplicate and privacy matrix passes |
| P0 | Verify production runtime assets and rollback | Data/infra owner | Asset-host access | Health check and immutable version pointer | Melbourne search loads after clean install; rollback drill passes |
| P0 | Run Play pre-launch report | Release owner | Internal artifact | Compatibility/accessibility/security report | No unresolved critical issue |
| P1 | Approve and deploy landing page | Founder/marketing + web owner | Final URLs/support/legal approval | Public landing URL | Mobile/desktop smoke test, QR and tracked links pass |
| P1 | Approve listing copy/screenshots | Founder + release owner | Current release scope | Store listing draft | No Marketplace or unsupported data claim |
| P1 | Start 5% staged production rollout | Release owner | All pre-release gates green | Controlled release | 24-hour vitals/data/support review |
| P1 | Produce demo video | Marketing | Approved discovery build | 20–30 second export plus captioned variant | Every shown action matches real product |
| P1 | Launch November channel kit | Marketing | Stable rollout + tracked links | Profiles and campaign posts | Acquisition by channel visible in Play |
| P2 | Configure Marketplace staging | Marketplace/backend/payments | GeoJSON, Supabase, Stripe and legal owners | Isolated test environment | Full gate test pack passes |
| P2 | Complete Marketplace legal/operations review | Legal/finance/ops | Product policy and payment design | Signed-off terms, tax, insurance and incident runbooks | Named approvers and review date |

The safest next release is the improved parking-discovery build. Marketplace should continue as a separately gated programme, not be bundled into the public launch claim.
