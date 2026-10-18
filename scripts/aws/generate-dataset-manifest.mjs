#!/usr/bin/env node
/**
 * Creates an auditable JSON inventory for deployable runtime datasets. It
 * records sha256, byte size, MIME type and relative path without reading or
 * publishing source-only archives. Use it before each dataset deployment.
 *
 * node scripts/aws/generate-dataset-manifest.mjs public/data --output /tmp/manifest.json
 */
import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { basename, extname, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const root = args.find(value => !value.startsWith('--'))
const outputIndex = args.indexOf('--output')
const output = outputIndex >= 0 ? args[outputIndex + 1] : undefined
if (!root || !output) {
  console.error('Usage: node scripts/aws/generate-dataset-manifest.mjs <runtime-directory> --output <manifest.json>')
  process.exit(2)
}

const mime = {
  '.json': 'application/json', '.gz': 'application/gzip', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
}
async function files(directory) {
  const rows = await fs.readdir(directory, { withFileTypes: true })
  return (await Promise.all(rows.map(async row => {
    const full = resolve(directory, row.name)
    return row.isDirectory() ? files(full) : row.isFile() ? [full] : []
  }))).flat()
}
function sha256(file) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256')
    createReadStream(file).on('data', chunk => hash.update(chunk)).on('error', reject).on('end', () => resolveHash(hash.digest('hex')))
  })
}
const absoluteRoot = resolve(root)
const entries = []
for (const file of (await files(absoluteRoot)).sort()) {
  const stats = await fs.stat(file)
  const extension = extname(file).toLowerCase()
  entries.push({ path: relative(absoluteRoot, file).replaceAll('\\', '/'), bytes: stats.size, sha256: await sha256(file), content_type: mime[extension] ?? 'application/octet-stream' })
}
const manifest = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_root: basename(absoluteRoot),
  files: entries.length,
  bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
  entries,
}
await fs.mkdir(resolve(output, '..'), { recursive: true })
await fs.writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote ${entries.length} checksummed files (${manifest.bytes} bytes) to ${output}`)
