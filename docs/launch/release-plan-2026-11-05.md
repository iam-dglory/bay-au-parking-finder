# BAY Android staged release plan

Prepared: 5 November 2026  
Release scope: parking discovery only. Marketplace V2 remains off.

## Release candidate

- Package: `au.com.bayparking.app`
- Local version: `1.2.1` / `versionCode 4`
- Signed AAB: `release/BAY-1.2.1-vc4.aab`
- AAB size: approximately 3.7 MB
- Required before upload: confirm that Play Console has not already consumed version code 4. If it has, increment `versionCode`, rebuild, repeat signature/manifest checks and use the rebuilt artifact.

## Pre-release gate

All items must have evidence before production submission:

1. Internal Play installation passes fresh install and upgrade paths.
2. Location allow/deny/recovery, Maps round-trip and Android back navigation pass.
3. Play pre-launch report has no new critical issue.
4. Supabase launch migration is applied and the public report flow passes staging RLS/rate-limit checks.
5. Runtime parking assets are reachable from the production asset host and versioned for rollback.
6. Data Safety, privacy policy, support contact and store copy match the actual discovery release.
7. Marketplace flag is absent or explicitly `false` in public build configuration.
8. Rollback owner, previous production version and runtime-data rollback pointer are recorded.

## Rollout

| Stage | Audience | Minimum observation window | Promotion gate |
|---|---:|---:|---|
| Internal | Named testers | One complete test cycle | Install/upgrade/permissions/navigation pass |
| Production 5% | New and updating users | 24 hours | No severe crash/ANR, no blocking search/data regression |
| Production 20% | Production | 24 hours | Vitals stable; zero-result and report rates reviewed |
| Production 50% | Production | 24–48 hours | No material degradation in discovery funnel or support issues |
| Production 100% | Production | Ongoing | Daily monitoring for first seven days |

Do not schedule stage increases automatically. A named release owner must review the gate evidence.

## Monitor during rollout

- Play: crash-free users, ANR, acquisition, uninstalls and device/Android-version outliers.
- BAY: first opens, parking searches, zero-result rate, detail views, direction opens and structured reports.
- Runtime assets: HTTP availability, cache/version correctness and country/region source failures.
- Support: broken navigation, incorrect location/price/restriction, blank map and permission recovery.

## Stop or rollback conditions

Stop promotion immediately for a crash/ANR regression, blank/empty discovery screen, widespread runtime-asset failure, incorrect location navigation, a privacy/security incident, or a material surge in high-confidence incorrect-data reports. Roll back the Play release when the binary causes the failure; roll back the runtime asset version when the fault is isolated to remotely served data.

## Rollback steps

1. Pause the staged rollout in Play Console.
2. Record time, affected version, Android versions, regions and symptoms.
3. Restore the last known-good runtime-data pointer if the fault is data-only.
4. Otherwise prepare a higher-version-code binary from the previous known-good commit.
5. Re-run internal install/upgrade/permission/navigation tests.
6. Publish an honest incident update and close only after metrics recover.

No upload, rollout or production setting was changed during this local preparation.
