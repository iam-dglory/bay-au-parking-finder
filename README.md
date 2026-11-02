# Bay — Find real parking, everywhere

A free, crowdsourced parking-sign finder, in pilot for Melbourne, Australia. Built on real council open data (on-street bay rules, live in-ground sensor occupancy, off-street car park capacity), with community reporting to fill gaps and keep it honest — never claims more certainty than the data supports.

- **Web (pilot link):** https://iam-dglory.github.io/bay-au-parking-finder/
- **Landing page (share this one):** https://iam-dglory.github.io/bay-au-parking-finder/landing.html
- **Feedback survey:** https://iam-dglory.github.io/bay-au-parking-finder/survey.html

## Repo layout

```
src/          React + TypeScript app (pages/, components/, lib/)
android/ ios/ Capacitor native projects
public/       static web files; public/data/ holds the parking catalogs (served from the web, not bundled into native apps)
datasets/     raw source data snapshots used to build the catalogs (see datasets/README.md)
supabase/     Postgres migrations (schema, RLS policies, RPCs) and Edge Functions
scripts/      data build/sync scripts (Python) and build helpers
docs/         project tracker, coverage audits, store/privacy readiness notes
marketing/    posters, video scripts, brand assets
```

## Stack

React + TypeScript + Vite + Tailwind, Capacitor (Android/iOS), Supabase (Postgres + PostGIS + pg_cron/pg_net for server-side sensor sync).

## Running locally

```bash
npm install
npm run dev       # web dev server
npm run build     # production build
npm run test      # unit tests
npm run cap:android && cd android && ./gradlew bundleRelease   # Android build (data loads from the web copy)
npm run cap:ios                                                # iOS sync, then archive in Xcode
```

Needs a `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see Supabase project settings — never commit the service role key).

## Deployment

- **Web pilot** deploys to the `gh-pages` branch (built with `--base=/bay-au-parking-finder/`), kept separate from `main` (the app source).
- **Database** changes go through `supabase/migrations/` — apply via Supabase's MCP tools or the SQL editor, matching the migration files here for history.
- **Sensor sync** runs entirely server-side via `pg_cron` + `pg_net` inside Supabase (see `scripts/sync_melbourne_sensors.py` and `.sql` for the one-off/manual version of the same logic).

## Coverage

Currently: City of Melbourne LGA (CBD, Docklands, Southbank, Carlton, North Melbourne, Kensington, Parkville, East Melbourne) plus Brisbane's CBD. See `datasets/README.md` for exactly what's imported from where, and `docs/feature-tracker.pdf` for the full pilot-v1-vs-update-v2 feature plan.

## Moderating reported signs

Open the app with `?moderate=1` (e.g. `https://iam-dglory.github.io/bay-au-parking-finder/?moderate=1`). The screen shows your anonymous account ID; add it once in the Supabase SQL editor:

```sql
insert into public.moderators (user_id, note) values ('<account id>', '<your name>');
```

## Rebuilding per-bay sign rules (Melbourne)

`python3 -I scripts/build_melbourne_bay_zone_rules.py` regenerates `public/data/melbourne/bay-zone-rules.json` from the council datasets in `datasets/melbourne-city-of-melbourne/`.

