# BAY Android launch QA report

Assessment date: 5 November 2026  
Package: `au.com.bayparking.app`  
Release under test: `1.2.1` (`versionCode 4`)  
Scope: public parking-discovery release. Marketplace V2 was deliberately disabled.

## Outcome

**Local release candidate: PASS WITH EXTERNAL RELEASE CHECKS PENDING.** The web application, production shell build and signed Android App Bundle build successfully. Automated tests passed. A real Melbourne search journey was manually exercised at a mobile viewport. Play Console upload, managed-device installation, physical-device permission checks, backend migration deployment and production telemetry verification were not performed in this local audit.

## Automated evidence

| Check | Result | Evidence |
|---|---|---|
| Source lint | PASS | `oxlint src` completed with no findings |
| TypeScript | PASS | `tsc -b` completed as part of production build |
| Unit/integration tests | PASS | 21 files; 100 tests passed |
| Production web build | PASS | Vite production build completed with public runtime datasets excluded from the shell |
| Android target compliance | PASS | `compileSdk 36`, `targetSdk 36`, `minSdk 24` |
| Release optimisation | PASS | R8 minification and resource shrinking enabled and executed |
| Signed bundle build | PASS | `bundleRelease` completed; `jarsigner` exit 0 and `jar verified` |
| Bundle identity | PASS | Manifest contains `au.com.bayparking.app` and `1.2.1` |
| App icon | PASS | Extracted 192 × 192 launcher icon visually matches the official BAY wordmark |
| Bundle size | PASS | Local AAB is approximately 3.7 MB because runtime parking datasets are not embedded |

Artifact: `release/BAY-1.2.1-vc4.aab`  
SHA-256: `d4c3a6a643e96a757fe7bc6b7d91ed7b64e0d3ff6e23cc9de79d0ddb54b5e4af`

## Manual mobile journey

| Test case | Expected | Actual | Result | Evidence / follow-up |
|---|---|---|---|---|
| Open current discovery build | Public navigation excludes Marketplace | Marketplace entry and Marketplace activity cards are absent by default | PASS | Default-off feature flag and mobile capture |
| Melbourne map | Nearby results render with 500 m default | Map, result markers and nearby summary rendered | PASS | `01-melbourne-map.png` |
| Map/list switch | Same search can be reviewed as a list | List populated without a blank state | PASS | `02-parking-list.png` |
| Parking detail | User sees source limits before directions | Detail sheet shows distance, source-supplied facts and honest missing-data text | PASS | `03-parking-details.png` |
| Information correction | User can choose a structured error category | Report form opens from a parking result | PASS locally | `04-report-information.png`; backend migration still pending |
| Filters | Radius/type controls are usable on mobile | Filter panel opens and controls are visible | PASS | `05-filters.png` |
| Parking guide | Sign guide remains accessible | Country guide and explanatory cards render | PASS | `06-parking-guide.png` |
| My Activity | Public activity page has no gated Marketplace content | Saved places/history/reporting sections render only | PASS after fix | `07-my-activity.png` |
| Analytics detail view | One open should create at most one detail event per selected result | React re-render duplication is guarded by result ID | PASS by code review/build | Verify row count after migration deployment |

## Defects found and resolved

1. **Marketplace content leaked into My Activity when the public flag was off.** Marketplace queries and sections are now gated by `marketplaceV2Enabled()`.
2. **Parking-detail analytics could repeat during object-identity re-renders.** Spot and area sheets now guard the recorded result ID.
3. **Full public-data copying stalls and inflates release builds.** The release shell uses `VITE_SKIP_PUBLIC_COPY=true`; parking datasets stay on the separately versioned asset host.

## Checks still required before rollout

| Check | Owner | Severity if missed | Exit evidence |
|---|---|---:|---|
| Upload a bundle with an unused Play `versionCode` | Release owner | Blocker | Play Console accepts artifact with no version conflict |
| Install from an internal Play track on at least one low/mid/high Android device | QA | High | Fresh install, upgrade, relaunch and uninstall/reinstall evidence |
| Permission lifecycle | QA | High | Allow, deny, deny permanently, settings recovery and approximate-location tests |
| App → Maps → BAY resume | QA | High | Search/location state is retained and recenter action works |
| Back navigation and process restoration | QA | High | No blank map, accidental exit or lost state |
| Poor/offline network | QA | High | Clear non-blocking state; no infinite loading; recovery after reconnect |
| Apply analytics/report migration to staging | Backend | High | RPC/RLS/rate-limit test matrix and exactly-once controlled events |
| Android vitals and pre-launch report | Release owner | High | No new critical crash, ANR, accessibility or compatibility issue |
| Real-suburb smoke sample | Data/QA | Medium | Documented searches across representative Melbourne inner/middle/outer suburbs |

## Honest coverage statement

This audit proves the tested discovery journey, not complete or 100% Melbourne coverage. Coverage and pricing vary by licenced source. No result should be marketed as live availability unless a compatible fresh reading exists, and physical signs and operator terms remain authoritative.
