# BAY launch analytics and dashboard specification

Prepared: 5 November 2026

## Audit result

- No Firebase Analytics or Google Analytics SDK was found in the application dependencies.
- Existing production data includes first-party Supabase `search_events` and `spot_visits` tables.
- This launch branch adds a privacy-minimised first-party `analytics_events` table and `record_analytics_event` RPC. It is implemented and build-tested locally but is **not operational until the new Supabase migration is applied**.
- Google Play acquisition, Android vitals and retention data remain in Play Console and must not be merged with in-app event totals.
- Public listing evidence showed `10+ downloads`; no authenticated Play Console data was available during this audit, so an exact install or active-user baseline is not claimed.

## Event contract

| Event | Trigger | Allowed properties | Release state |
|---|---|---|---|
| `first_open` | First genuine launch on one install/profile | app platform, release version | Local; migration pending |
| `parking_search` | User executes current-location or destination search | country, radius, result count, search mode | Local; migration pending |
| `parking_result_view` | User opens parking-area or bay details | result type, source kind, has published price | Local; migration pending |
| `directions_open` | User opens external navigation | result type, source kind | Local; migration pending |
| `restriction_view` | User expands restriction or tariff information | result type, detail kind | Local; migration pending |
| `marketplace_view` | User visits Marketplace | preview/public mode | Flagged off publicly |
| `listing_started` | Host begins a listing | space type when chosen | Flagged off publicly |
| `listing_submitted` | Server accepts a listing submission | internal listing ID, moderation state | Flagged off publicly |
| `booking_started` | Server creates a reservation hold / checkout | internal listing ID, currency, duration band | Flagged off publicly |
| `booking_confirmed` | Verified Stripe webhook creates the booking | internal booking ID, currency, amount band | Backend code added; deployment and Stripe verification pending |
| `feedback_submitted` | Feedback/report RPC succeeds | feedback type, report category, screen | Local; migration pending |

Never send precise coordinates, typed addresses, private-space access instructions, names, email addresses, number plates, screenshots, payment credentials or free-text feedback as event properties.

## Dashboard panels

### Google Play Console — acquisition and quality

- Store listing visitors
- First-time installers / acquisitions
- Acquisition source and country where available
- Install conversion rate
- Uninstalls
- Crash-free users and ANR rate
- Day-1 and Day-7 retention
- Android version and device breakdown

### BAY first-party product dashboard

- First opens: distinct `first_open` source keys
- Active users: distinct anonymous user IDs with any event by day/week/month
- Parking searches: count of `parking_search`
- Searches per active user: searches ÷ active users
- Result views: count of `parking_result_view`
- Navigation requests: count of `directions_open`
- Search-to-navigation conversion: distinct sessions with directions ÷ sessions with a search
- Restriction engagement: distinct sessions with `restriction_view` ÷ sessions with result views
- Feedback rate: feedback submissions ÷ active users
- Marketplace interest: `marketplace_view` after the flag is deliberately enabled
- Listing conversion: submitted listings ÷ listing starts
- Confirmed booking conversion: webhook-confirmed bookings ÷ booking starts

## November goal

Goal: **1,000+ new Android acquisitions during November 2026.** Measure this from Play Console acquisitions, not `first_open`. Use in-app events to explain activation and conversion after acquisition.

## Daily launch view

| Metric | Source | Alert threshold |
|---|---|---|
| Acquisitions | Play Console | Compare with 34/day pace for 1,000/month |
| Store conversion | Play Console | Investigate material 7-day decline |
| First opens | BAY events | Investigate persistent gap versus acquisitions after reporting delay |
| Search success | BAY events | Alert if searches with zero results materially increase by country |
| Search → directions | BAY events | Monitor trend; no invented target until baseline exists |
| Crash-free users | Android vitals | Stop rollout on severe regression |
| Report volume | BAY reports | Review by category and duplicate rate daily during launch |

## Verification before enabling

1. Apply `20261104120000_launch_analytics_and_parking_reports.sql` to staging.
2. Confirm RLS and RPC rate limits with anonymous and authenticated sessions.
3. Execute one controlled event for each public discovery event and verify exactly one row.
4. Confirm no coordinates, addresses or free text are present in `properties`.
5. Verify `booking_confirmed` only after a valid signed Stripe webhook in test mode.
6. Add the dashboard queries to an authorised admin-only view.
