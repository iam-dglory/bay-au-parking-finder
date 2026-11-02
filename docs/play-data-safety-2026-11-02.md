# Play Data safety form — answers matching the code (2 Nov 2026)

Fill the Play Console **App content › Data safety** form with these answers, then re-check them against `public/privacy-policy.html`. Based on the source and migrations up to `20261105100000_privacy_moderation_hardening.sql`. Covers the public release; Marketplace V2 (Stripe payments, host accounts) needs its own entries before it ships.

| Data type (Play category) | Collected? | Shared? | Optional? | Purpose | Where in code |
| --- | --- | --- | --- | --- | --- |
| Precise location | Yes | No | Yes (can pick an area instead) | App functionality | `geolocation.ts`; searches stored with coordinates in `search_events` |
| Photos | Yes, only when reporting a sign | No | Yes | App functionality | `photos.ts` → private `sign-photos` bucket |
| App interactions (searches, directions opened, product events) | Yes | No | No | Analytics, app functionality | `search_events`, `spot_visits`, `analytics_events` (`record_analytics_event`) |
| Other user-generated content (sign reports, incorrect-information reports, feedback text) | Yes | No | Yes | App functionality | `parking_spots`, `parking_rules`, `parking_information_reports`, `app_feedback` |
| Photos (report screenshots) | Yes, optional | No | Yes | App functionality | private `parking-report-screenshots` bucket |
| User IDs | Yes (anonymous Supabase account ID) | No | No | App functionality | `supabaseClient.ts` `signInAnonymously` |
| Email address | Only on the web waitlist, not in the app | No | Yes | Developer communications | `public/waitlist-form.js` |

- **Encrypted in transit:** Yes (HTTPS to Supabase, council API, map tiles).
- **Users can request deletion:** Yes — in-app at My activity › Delete my data (`delete_my_data()` RPC + photo removal), and by email.
- **Third parties that receive requests (not "sharing" under Play's definition, but list in the policy):** Supabase (database/storage), City of Melbourne open-data API, map tile and geocoding providers.

Before submitting: confirm Supabase project region in the dashboard and that the privacy policy names it.
