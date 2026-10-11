# Book a spot: Phase 1 readiness

**Reviewed:** 11 October 2026 (Australia/Melbourne)  
**Status:** Safe external-booking entry point shipped locally; direct Bay reservations are deliberately unavailable.

## What Bay can truthfully offer today

Bay can show nearby source-backed parking records and send a driver to an external operator only when all of the following are configured and verified for that exact off-street facility:

- a current HTTPS booking URL;
- the named operator and its provider location identifier;
- an explicit connection between the Bay parking record and the provider facility; and
- the applicable source-backed price summary.

The verified-provider registry is currently empty. No parking area is therefore presented as reservable, no checkout is offered, and no amount, deposit, time slot, availability, or confirmation is invented. The Book a spot tab instead explains this honestly and returns the driver to the normal parking search.

## Audit findings

The repository contains a historical peer-to-peer `public.bookings` table. It is not wired to any parking operator, availability service, payment processor, provider webhook, booking URL registry, payment policy, or confirmation service. Its previous client-write policies could allow a browser to create a row with a `confirmed` status. That must never be treated as an actual parking reservation.

No existing `offstreet_car_parks` record has enough verified booking data to populate the registry. Street bays, meters, zones, mapped parking features, source-only records, and facilities without a verified operator connection are not eligible.

## Phase 1 delivered

- Replaced the bottom navigation's **Add a sign** entry with **Book a spot**.
- Added an external-provider eligibility gate. It accepts only an exact registry match for an off-street parking area and validates its HTTPS provider URL, operator and provider location ID.
- Added the Book a spot screen, a nearby map, a clear loading state, and an honest empty state. Where providers are later verified, it will link out to the operator and label the handoff as external.
- Rebuilt **My activity** using real local Home/Work choices, genuine direction history and genuine sign submissions. It has no manufactured booking history. The sign-report flow remains available from that page.
- Fixed the list screen's content offset so floating map controls do not cover the first parking cards.
- Added a Supabase migration that removes public client insert/update/delete rights for the legacy `bookings` table and removes its unsafe client-write policies.

## What must happen before Bay checkout exists

1. Establish a written/operator-approved integration for each provider and verify the provider's facility ID and booking URL.
2. Maintain a server-side verified-provider registry, with a revalidation date and a process for disabling a provider immediately when its details change.
3. Retrieve availability and an authoritative quote from the provider on the server, within the operator's permitted window.
4. Obtain deposit, refund, cancellation, currency and tax terms from that exact operator/quote. Do not use default amounts.
5. Process payment with a compliant payment provider. The client must never mark a booking confirmed.
6. Create an idempotent server-side booking request and only record confirmation after an operator response or verified webhook provides a provider reference.
7. Add authenticated access, RLS, audit records, expiry/cancellation handling and test coverage for failed payment, retry, webhook and provider-timeout cases.
8. Add the date/time, duration, payment and confirmation screens only after the above is working. A local UI alone is not a reservation system.

## Deployment note

The safety migration is included in source but has **not** been applied to Supabase in this workspace: the Supabase CLI/authenticated deployment connection was not available. Direct checkout remains unavailable in the app regardless. Apply the migration through the authenticated project deployment before enabling any future booking backend.

## Verification

- `npm test`: 87 tests passed across 18 test files.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
