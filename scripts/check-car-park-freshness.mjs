// Lists car park prices older than the file's stale_after_days, and car parks
// with no map location. Exits 1 when any price is stale.
import { readFileSync, appendFileSync } from 'node:fs'

const file = JSON.parse(readFileSync(new URL('../public/data/melbourne/car-park-rates.json', import.meta.url)))
const today = new Date(process.env.CHECK_DATE ?? Date.now())
const days = iso => Math.floor((today - new Date(`${iso}T00:00:00Z`)) / 86_400_000)

const stale = file.car_parks.filter(p => days(p.checked) > file.stale_after_days)
const unmapped = file.car_parks.filter(p => p.lat == null || p.lng == null)

const lines = [`## Car park prices (${file.car_parks.length} car parks, stale after ${file.stale_after_days} days)`, '']
lines.push(stale.length ? `**${stale.length} need re-checking:**` : 'All prices checked recently.')
for (const p of stale) lines.push(`- [ ] ${p.name} (${p.operator}): last checked ${p.checked}, ${days(p.checked)} days ago. ${p.source_url}`)
if (unmapped.length) {
  lines.push('', `**${unmapped.length} not on the map (no coordinates):**`)
  for (const p of unmapped) lines.push(`- ${p.name} (${p.operator})`)
}
const report = lines.join('\n')
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n')
if (process.env.REPORT_FILE) appendFileSync(process.env.REPORT_FILE, report + '\n')
process.exit(stale.length ? 1 : 0)
