# Marketplace V2 release gate

Assessment date: 5 November 2026  
Decision: **READY FOR INTERNAL TESTING AFTER STAGING CONFIGURATION**  
Not ready for closed testing or any production transaction rollout.

## Gate evidence

| Requirement | Evidence in repository | Verified deployment/test | Gate |
|---|---|---:|---|
| Host listing eligibility | Verified-account requirement, rights and approval attestations, private-road prohibition | No end-to-end staging evidence | TESTING |
| Parking-type selection | Six server-controlled private-space types | Unit/UI build only | READY FOR RELEASE |
| Location-based pricing | PostGIS zones, priority and price bands | Zones are intentionally inactive and have no verified boundary geometry | BLOCKED |
| Hour/day/week/month pricing | Stored and validated server-side | No staging boundary means listing submission cannot complete | TESTING |
| Yearly pricing | Explicitly disabled by policy and server validation | Verified in migration logic | NOT IMPLEMENTED by design |
| 5% configurable commission | Versioned policy uses `500` basis points; server calculates fee | No real/test checkout evidence in this audit | TESTING |
| Server-side pricing validation | Price-band and space-type caps in `marketplace_submit_listing_v2` | SQL not executed in this environment | TESTING |
| Listing moderation | `pending_review`, active/rejected/suspended states and admin UI | Moderator role and staging workflow not proven | TESTING |
| Stripe Connect onboarding | Express account and account-link edge function | Secrets, return URLs and AU test account not verified | BLOCKED |
| Driver payments | Checkout with application fee and connected account | No signed test checkout evidence | BLOCKED |
| Booking confirmation | Only a verified paid Stripe webhook calls the confirmation RPC | Webhook secret/retry/idempotency test not performed | BLOCKED |
| Double-booking prevention | Exclusion constraints, reservation holds and overlap checks | Concurrency test not performed against staging Postgres | TESTING |
| Cancellations/refunds | Tiered server cancellation and Stripe refund flow | Refund/partial-refund/failed-refund tests missing | BLOCKED |
| Host earnings/payouts | Allocation fields, host profile and payout event records | Connect payout lifecycle not verified | BLOCKED |
| Security policies | RLS, service-role RPC boundaries, private listing-photo policy | Independent RLS abuse test pending | TESTING |
| Legal/tax | Host authority attestations and policy text exist | Australian marketplace, tax, consumer, strata and insurance review absent | BLOCKED |
| Monitoring | Audit/webhook tables and admin metrics exist | Alerting/runbook and production ownership absent | BLOCKED |

## Important implementation facts

- The provisional policy is configured at 5%, but policy activation alone does not make Marketplace live.
- Every pricing-zone row defaults inactive and can become active only with geometry, source and verification timestamp.
- The listing RPC rejects locations outside an active verified BAY pricing zone.
- Exact access details remain private until a booking is confirmed.
- Booking confirmation is server-side and tied to a signed paid Stripe webhook.
- Public app navigation and My Activity Marketplace sections are now protected by a default-off `VITE_ENABLE_MARKETPLACE_V2` flag. Internal previews can use `?marketplace-preview=1`.

## Minimum path to closed testing

1. Apply Marketplace migrations to an isolated staging Supabase project.
2. Import licence-compatible, authoritative Melbourne pricing-zone GeoJSON; record source/version and verification date; activate only reviewed polygons.
3. Configure Stripe test mode, Connect return/refresh URLs and signed webhook secret.
4. Create separate driver, host, moderator and attacker test accounts.
5. Pass listing, moderation, checkout, webhook replay, concurrency conflict, cancellation, partial refund, payout and RLS tests.
6. Complete Australian legal/tax/consumer/insurance review and update terms/data-safety disclosures.
7. Add monitoring for webhook failures, unconverted holds, pending refunds, disputes and restricted host accounts.
8. Enable only in an internal build, then make a separate decision for closed testing.

## Production rollout rule

Do not enable `VITE_ENABLE_MARKETPLACE_V2=true` in the public build until every BLOCKED item above has evidence, an owner and a rollback procedure. Public discovery can ship separately.
