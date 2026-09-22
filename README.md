# Bay — Find real parking, everywhere

A free, crowdsourced parking-sign finder, in pilot for Melbourne, Australia. Built on real council open data (on-street bay rules, live in-ground sensor occupancy, off-street car park capacity), with community reporting to fill gaps and keep it honest — never claims more certainty than the data supports.

- **Web (pilot link):** https://iam-dglory.github.io/bay-au-parking-finder/
- **Landing page (share this one):** https://iam-dglory.github.io/bay-au-parking-finder/landing.html
- **Feedback survey:** https://iam-dglory.github.io/bay-au-parking-finder/survey.html

## Repo layout

```
app/          the actual application — see below, this is the repo root's src/, android/, etc.
datasets/     raw source data snapshots used to seed the database (see datasets/README.md)
marketing/    posters, video scripts, brand assets for promoting the pilot
docs/         planning docs — feature tracker, store listing, privacy policy
supabase/     Postgres migrations (schema, RLS policies, RPCs) for the Supabase backend
scripts/      one-off/scheduled data-sync Python scripts (sensor sync, address backfill, etc.)
```

## Stack

React + TypeScript + Vite + Tailwind, Capacitor (Android/iOS), Supabase (Postgres + PostGIS + pg_cron/pg_net for server-side sensor sync).

## Running locally

```bash
npm install
npm run dev       # web dev server
npm run build     # production build
npm run test      # unit tests
npx cap sync android && cd android && ./gradlew assembleDebug   # Android debug build
```

Needs a `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see Supabase project settings — never commit the service role key).

## Deployment

- **Web pilot** deploys to the `gh-pages` branch (built with `--base=/bay-au-parking-finder/`), kept separate from `main` (the app source).
- **Database** changes go through `supabase/migrations/` — apply via Supabase's MCP tools or the SQL editor, matching the migration files here for history.
- **Sensor sync** runs entirely server-side via `pg_cron` + `pg_net` inside Supabase (see `scripts/sync_melbourne_sensors.py` and `.sql` for the one-off/manual version of the same logic).

## Coverage

Currently: City of Melbourne LGA (CBD, Docklands, Southbank, Carlton, North Melbourne, Kensington, Parkville, East Melbourne) plus Brisbane's CBD. See `datasets/README.md` for exactly what's imported from where, and `docs/feature-tracker.pdf` for the full pilot-v1-vs-update-v2 feature plan.
