# BAY Marketplace — Australian private parking MVP

Updated: 2 November 2026

## Product promise

BAY lets a driver discover, compare, book and pay for a verified private parking space before arriving. A host can earn from a driveway, private garage, titled apartment bay or authorised commercial space that would otherwise sit empty.

The marketplace is separate from BAY's public parking information. A public kerb, council bay, visitor bay or common-property space cannot be offered by an individual host.

## Initial launch boundary

- Australia only and AUD only.
- Eligible: private driveway, private garage, apartment bay controlled by the host, or authorised commercial space.
- Not eligible: public roads, kerbs, clearways, accessible bays, loading zones, visitor bays, shared/common property without written authority, or any place the host cannot legally control.
- Every listing starts in `pending_review`; only BAY moderation can make it `active`.
- The exact entrance, access instructions and gate code stay private until a server-confirmed booking.
- Pre-booking search exposes an approximate map point and suburb, not a home's exact address.

## Driver flow

1. Search a destination or use current location.
2. See approved private spaces mixed with verified operator car parks, but visually labelled as different products.
3. Compare distance, space type, vehicle fit, availability, photos, cancellation terms and full price.
4. Select start and end time.
5. The server rechecks availability and calculates the authoritative price and BAY fee.
6. Pay through the marketplace checkout.
7. A payment webhook, not the phone, changes the booking to `confirmed`.
8. After confirmation, reveal the exact entrance and access instructions.
9. Check in/out, review the space and raise a support case if needed.

## Host flow

1. Verify email, phone and identity; complete marketplace payout onboarding.
2. Pin the private entrance and add the full address.
3. Upload one to eight current photos.
4. Describe access, height/vehicle limits and availability.
5. Set one or more AUD prices: hourly, daily, weekly or monthly. Yearly pricing is disabled for launch.
6. Attest ownership/authority, building or owners-corporation approval, and insurance compliance.
7. BAY reviews the evidence before publishing.
8. Host receives booking and payout records, with fees shown separately.

Weekly and monthly products need explicit cancellation, access and long-term occupancy terms. They remain one-off fixed-duration products until recurring payments have been legally reviewed.

## Revenue model

Start with one transparent fee deducted from the host allocation. The provisional launch policy is 5% of the parking subtotal, configurable through a versioned server policy rather than hard-coded throughout the app.

Example only:

- Driver parking subtotal: A$30.00
- BAY gross commission at 5%: A$1.50
- Host gross allocation before any separately allocated processing/tax adjustments: A$28.50

The checkout must show the driver total before payment and the host dashboard must show gross revenue, BAY fee, refunds and net payout. Do not calculate or trust fees supplied by the browser.

## Trust and safety gates

- Email, phone and identity/payout verification for hosts.
- Evidence of ownership or written authority; extra proof for apartment and commercial sites.
- Manual first-listing review and risk-based repeat review.
- Address/photo duplication checks and a public-road geofence/moderation rule.
- Vehicle-size, entrance, lighting, accessibility and height-limit fields.
- Report listing, emergency support, refund/dispute workflow and host/driver reviews.
- Clear host tax, insurance and building-rule reminders.
- Privacy notice for location, identity, payment and photo collection; retention and deletion controls.

## Technical design in this repository

Migration `20261102120000_private_parking_marketplace_foundation.sql` creates the base tables. Migration `20261103120000_marketplace_v2_pricing_booking_payments.sql` adds:

- `marketplace_host_profiles`: identity and payout readiness.
- `marketplace_listings`: moderated off-street inventory with prices and photo paths.
- `marketplace_listing_private`: access instructions separated from public search data.
- `marketplace_bookings`: server-controlled booking, fee and payment state.
- `nearby_marketplace_listings`: active-only search returning approximate coordinates.
- A private `listing-photos` storage bucket with host and approved-listing read policies.
- Versioned zone/type pricing policy and server-assigned verified geometry.
- Normalized prices, reservation holds, payment/refund/webhook ledgers and audit logs.
- Server-only listing submission, quote/hold, checkout attachment and webhook confirmation functions.

The client can submit a listing for review. It cannot activate a listing or create/confirm/update a marketplace booking.

## Payment launch gates before checkout is enabled

1. Confirm the Stripe Connect account and charge architecture, liability and fee allocation.
2. Apply and validate the V2 migration and Edge Functions in staging.
3. Store provider secrets only in server secret management.
4. Recheck listing status and overlapping bookings in a database transaction.
5. Calculate price and fee from server-owned configuration.
6. Use idempotency keys for checkout and booking creation.
7. Verify signed payment webhooks and only then set `confirmed`.
8. Reconcile payments, transfers, refunds and disputes daily.
9. Add production monitoring, support tooling and an auditable moderation console.

## Launch sequence

### Phase 1 — supply and trust

- Apply the migration in a staging Supabase project.
- Complete host authentication, moderation tools and listing QA.
- Recruit 50–100 verified spaces in one Melbourne corridor.
- Let drivers browse; manually review every listing.

### Phase 2 — paid pilot

- Enable provider sandbox payments and payout onboarding.
- Run end-to-end tests for success, failed payment, duplicate tap, refund, dispute and webhook retry.
- Launch paid bookings to a small invited cohort.
- Track search-to-space coverage, booking conversion, cancellations, support incidents and repeat bookings.

### Phase 3 — marketplace scale

- Expand suburb by suburb based on unmet searches, not state-wide vanity inventory.
- Add calendar sync, instant booking for proven hosts, reviews, recurring products and business/operator accounts.
- Test pricing/fee levels only after reliable booking and retention data exists.

## Definition of ready for public paid bookings

- No confirmed booking can be created from the client.
- Payment and availability webhooks are verified and idempotent.
- Double-booking tests pass under concurrency.
- Exact addresses/access details remain private until confirmation.
- Hosts have payout/identity status `ready`/`verified`.
- Refund, cancellation, dispute and support processes have named owners.
- Marketplace terms, privacy notice, host attestation and insurance/tax disclosures have Australian legal review.

## Primary Australian references used for the launch boundary

- Consumer Affairs Victoria: owners-corporation rules cover parking and apply to owners, tenants, sub-lessees and occupiers: https://www.consumer.vic.gov.au/housing/owners-corporations/rules/which-owners-corporations-have-rules
- Transport Victoria: street parking is governed by road rules and street permits are handled by local councils: https://transport.vic.gov.au/road-and-active-transport/road-rules-and-safety/parking
- OAIC: the Australian Privacy Principles cover collection, use, security, access and correction of personal information: https://www.oaic.gov.au/privacy/australian-privacy-principles
- ATO guidance treats peer-to-peer sharing of a car parking space as income that may need to be reported: https://www.ato.gov.au/api/public/content/0-34707784-1a6f-4f97-a827-eabeba9c31a6
- Stripe Connect destination charges can collect a platform fee and transfer the remainder to a connected host account: https://docs.stripe.com/connect/destination-charges

These references guide product controls; they are not a substitute for legal, tax or insurance advice for BAY or an individual host.
