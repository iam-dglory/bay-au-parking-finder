# BAY Marketplace V2 — pricing, booking and payment implementation

Updated: 3 November 2026

## Delivered in this change

The repository now contains a server-owned Marketplace V2 foundation. It is intentionally **not deployed and not live-payment enabled** by this change.

| Area | Implementation |
| --- | --- |
| Fee policy | Versioned database policy; launch seed is 5% BAY gross commission, A$0 listing fee, A$0 driver fee, A$5 minimum subtotal. All money uses integer cents. |
| Price guardrails | Eight provisional location categories, four duration bands and six space-type policies. Hour/day maximum is the lower of zone and type caps. |
| Geography | Server assigns a zone from admin-supplied Polygon/MultiPolygon geometry. Seeded categories are inactive and unbookable until sourced geometry is verified. |
| Host flow | Verified-account requirement, 1–8 photos, private-space declarations, server zone preview, allowed-range guidance, fee/host-allocation preview and server-only submission RPC. |
| Durations | Hour/day/week/month. Year is disabled. Hourly reservations are 2–24 hours; advance window 90 days; maximum five active driver bookings. |
| Booking integrity | Server quote/hold RPC, 35-minute hold, database exclusion constraint, confirmed-booking overlap check and idempotency key. Browser amounts are never authoritative. |
| Checkout | Test-gated Edge Function creates a Stripe Checkout Session using a destination charge and the database-calculated application fee. |
| Confirmation | Signature-verified, timestamp-limited webhook; idempotency ledger; transactional booking confirmation RPC. Success-page redirects never confirm a booking. |
| Host payouts | Test-gated Stripe-hosted Connect onboarding. Webhooks update charge/payout capability status. |
| Cancellations | Draft 100/75/50/0 policy, host cancellation at 100%, payment-provider refund call, transfer/application-fee reversal, webhook reconciliation and audit trail. |
| Administration | Restricted dashboard at `?marketplace-admin=1` for moderation, sourced zone GeoJSON and new policy versions. Admin status is database-owned. |
| Audit/privacy | Exact access records remain separate; public search uses rounded coordinates. Sensitive payment tables deny client writes. Administrative and webhook actions are logged. |
| Finance records | Live/test payment mode, refunds, disputes and connected-account payout events are stored separately. Analytics labels gross commission rather than profit. |
| Future commercial controls | Pricing-exception and promotion records exist but are inactive and are not applied by launch quotes until funding, tax and disclosure rules are approved. |

## Data model

Migration `20261103120000_marketplace_v2_pricing_booking_payments.sql` extends the existing marketplace rather than creating a parallel product. New records include:

- versioned commercial and cancellation policies;
- pricing zones, pricing bands and space-type caps;
- normalized listing prices and availability exceptions;
- reservation holds, payment reconciliation, refunds, disputes, payout events and webhook idempotency;
- administrator membership and immutable-style audit events.

The old listing price columns remain temporarily for backwards-compatible nearby search. New V2 submissions write both normalized and compatibility fields through one database function. Direct browser insert/update access to marketplace listings is revoked.

## Deterministic zone assignment

Hosts cannot choose a zone. The server finds active verified boundaries covering the submitted point, then orders overlaps by:

1. higher administrator-controlled priority;
2. smaller boundary area;
3. stable zone code.

The provisional priority order is event area, airport surrounds, hospital, university, train station, Melbourne CBD, inner suburb, outer suburb. These are classification priorities only; no boundary is activated until its source and verification date are stored.

## Stripe architecture boundary

The code path is locked unless all of these are true:

- `MARKETPLACE_PAYMENTS_ENABLED=true`;
- `STRIPE_CONNECT_ARCHITECTURE=express_destination_charges`;
- server-side Stripe/Supabase secrets are installed;
- live mode additionally has `MARKETPLACE_ALLOW_LIVE_STRIPE=true`.

This implementation uses Express connected accounts, Stripe-hosted onboarding and destination charges. BAY must confirm merchant-of-record, dispute, negative-balance, processing-fee and GST responsibilities before approving that architecture. The account/dashboard choice should be treated as a launch decision, not an incidental code default.

Server configuration is documented in `supabase/functions/.env.example`. Never place `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in `.env`, the browser bundle, Git or chat.

## Required staging sequence

1. Create a disposable/staging Supabase project and apply all migrations.
2. Add the first administrator directly through a controlled database operation; never provide public admin signup.
3. Load and independently review sourced zone GeoJSON through the restricted dashboard.
4. Configure exact staging origins/return URLs and test-mode secrets.
5. Deploy Edge Functions and register the webhook endpoint for the handled event types.
6. Run `supabase/tests/marketplace_v2_policy.sql` against staging.
7. Exercise duplicate checkout, concurrent hold, stale hold, failed payment, delayed webhook, duplicate webhook, Connect restriction, partial refund, full refund and dispute paths.
8. Reconcile Stripe test objects with database payments/bookings and inspect audit events.
9. Complete Australian legal, consumer, privacy, tax, insurance and commercial-policy review.
10. Only after written approval, configure production secrets and separately approve live mode.

## Known launch blockers

- No verified Melbourne zone geometry has been supplied in this repository.
- The form supports map pin plus typed address, but a validated address-autocomplete provider is not yet connected; moderation must treat the address as unverified.
- Stripe platform ownership, capabilities, fee allocation, tax treatment and webhook endpoints have not been confirmed against a real account.
- No staging database/Stripe test credentials were available in this workspace, so migration and end-to-end payment execution were not run here.
- Cancellation percentages are draft commercial terms and require Australian legal/consumer review.
- Admin refund exceptions, dispute evidence submission, provider processing-fee enrichment and daily reconciliation need an operating owner and runbook before launch.

## Verification available locally

- TypeScript compile and frontend lint.
- Marketplace money, price-cap and cancellation boundary unit tests.
- Production web build.
- Read-only database policy assertion script for a staging PostgreSQL/Supabase environment.

Passing local tests does not make payments production-ready. Live readiness requires the staging sequence above.
