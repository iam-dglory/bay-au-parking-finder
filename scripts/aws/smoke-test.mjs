#!/usr/bin/env node
/** Basic, read-only deployment check. */
const base = process.argv[2]?.replace(/\/$/, '')
if (!base) throw new Error('Usage: node scripts/aws/smoke-test.mjs <https://distribution-domain>')
const paths = ['/', '/index.html', '/data/melbourne/index.json', '/data/india/index.json', '/data/australia/index.json', '/data/usa/index.json']
for (const path of paths) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`)
  console.log(`${response.status} ${path}`)
}
