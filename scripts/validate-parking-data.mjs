import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const dataDir = join(process.cwd(), 'public', 'data', 'melbourne')
const index = JSON.parse(await readFile(join(dataDir, 'index.json'), 'utf8'))

if (index.schema_version !== 2) throw new Error(`Unsupported Melbourne schema: ${index.schema_version}`)
if (!Array.isArray(index.tiles) || index.tiles.length === 0) throw new Error('Melbourne tile index is empty')
if (new Set(index.tiles).size !== index.tiles.length) throw new Error('Melbourne tile index contains duplicate tile names')

const ids = new Set()
let records = 0
let areas = 0
let bays = 0
let priced = 0
let bytes = 0

for (const tile of index.tiles) {
  if (!/^-?\d+_-?\d+$/.test(tile)) throw new Error(`Invalid tile name: ${tile}`)
  const path = join(dataDir, `${tile}.json`)
  const [raw, info] = await Promise.all([readFile(path, 'utf8'), stat(path)])
  bytes += info.size
  const rows = JSON.parse(raw)
  if (!Array.isArray(rows)) throw new Error(`${tile}.json must contain an array`)
  for (const row of rows) {
    records += 1
    if (!row.id || typeof row.id !== 'string') throw new Error(`${tile}: record without a stable id`)
    if (ids.has(row.id)) throw new Error(`Duplicate parking id: ${row.id}`)
    ids.add(row.id)
    if (!Number.isFinite(row.lat) || row.lat < -39.5 || row.lat > -36 || !Number.isFinite(row.lng) || row.lng < 143 || row.lng > 146.5) {
      throw new Error(`${row.id}: coordinate is outside the Melbourne dataset envelope`)
    }
    if (!['area', 'bay'].includes(row.kind)) throw new Error(`${row.id}: unsupported kind ${row.kind}`)
    if (!row.source_url || !/^https:\/\//.test(row.source_url)) throw new Error(`${row.id}: missing source URL`)
    if (!row.source_name) throw new Error(`${row.id}: missing source attribution`)
    if (row.kind === 'area') areas += 1
    else bays += 1
    if (row.fee != null && row.fee !== '' && row.fee !== 'unknown') priced += 1
  }
}

const expected = index.coverage?.imported
if (expected != null && records !== expected) throw new Error(`Index says ${expected} imported records, tiles contain ${records}`)
if (records < 50_000) throw new Error(`Unexpectedly small Melbourne dataset: ${records} records`)

console.log(`Parking data OK: ${records.toLocaleString()} records across ${index.tiles.length.toLocaleString()} tiles (${bays.toLocaleString()} bays, ${areas.toLocaleString()} areas, ${priced.toLocaleString()} records with fee metadata, ${(bytes / 1024 / 1024).toFixed(1)} MB).`)
