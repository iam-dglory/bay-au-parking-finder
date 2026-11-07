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


## CI/CD (GitHub Actions)

| Workflow | Runs when | Does |
| --- | --- | --- |
| `ci.yml` | every PR and push to `main` | lint, type-check, tests, build |
| `deploy-pages-production.yml` | **automatically after CI passes on `main`**; or by hand with a commit SHA (rollback) | builds and publishes the GitHub Pages site (also the data host for native builds) |
| `deploy-aws-staging.yml` / `deploy-aws-production.yml` / `deploy-datasets.yml` | see each file | CloudFront/S3 app and data deploys |
| `supabase.yml` | by hand only, needs approval in the `production` environment | `supabase db push` (dry run by default), optional `waitlist-notify` deploy |
| `android-release.yml` | pushing a tag like `v1.2.2` | signed AAB + `mapping.txt` as a downloadable artifact |

Settings (Settings → Secrets and variables → Actions):

- **Variables (needed by the Pages deploy too; it stops with an error if the Supabase ones are missing):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon key), `VITE_GOOGLE_MAPS_API_KEY`, optional `VITE_GOOGLE_MAP_ID`, `SUPABASE_PROJECT_REF` (`ezwiagssiuvmhayvsmbk`), optional `VITE_ASSET_BASE_URL` (defaults to the GitHub Pages site)
- **Secrets:** `SUPABASE_ACCESS_TOKEN` (supabase.com → Account → Access tokens), `SUPABASE_DB_PASSWORD`, `ANDROID_KEYSTORE_BASE64` (`base64 -i upload.p12`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
- **Environment:** create `production` (Settings → Environments) with a required reviewer.

First Supabase run: keep `dry_run` on and check the list. If it wants to re-apply old migrations that were applied by hand, mark them as applied with `supabase migration repair --status applied <version>` instead of pushing them again.

## Prices: "how long can I stay and what will it cost"

- **Street parking (City of Melbourne):** `python3 -I scripts/build_melbourne_street_rates.py` builds `public/data/melbourne/street-rates.json` from the council Pay Stay datasets. Streets with one pay zone (or identical zones) get an exact price; others show a range. Re-run after refreshing the council datasets.
- **Car parks:** `public/data/melbourne/car-park-rates.json` is maintained by hand from each operator's published **drive-up** rates, with `source_url` and `checked` date. The app flags entries older than 45 days. To add one: copy an entry, fill in rates from the operator page, set `lat`/`lng` (entries with `null` coordinates are kept but not shown). Do not scrape operator sites.
- **Calculator:** `src/lib/parkingCost.ts` (tests in `parkingCost.test.ts`).

## Map

Google Maps (`@vis.gl/react-google-maps`). Set `VITE_GOOGLE_MAPS_API_KEY` (and optionally `VITE_GOOGLE_MAP_ID`) in `.env` and as a GitHub Actions variable. Without a key the app still works and shows prices as a list.

