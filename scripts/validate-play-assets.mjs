import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const appTitle = 'BAY: Find Parking'
const width = 780
const height = 1688
const required = [
  '01-melbourne-map.png',
  '03-parking-details.png',
  '05-filters.png',
  '02-parking-list.png',
  '04-report-information.png',
]

if (appTitle.length > 30) {
  throw new Error(`Play app title is ${appTitle.length} characters; maximum is 30`)
}

for (const file of required) {
  const path = resolve('marketing/play-store/screenshots', file)
  const bytes = await readFile(path)
  const info = await stat(path)
  const pngSignature = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const imageWidth = bytes.readUInt32BE(16)
  const imageHeight = bytes.readUInt32BE(20)
  if (!pngSignature || imageWidth !== width || imageHeight !== height || info.size < 10_000) {
    throw new Error(`${file} is not a verified ${width}x${height} production PNG`)
  }
}

console.log(`Validated ${required.length} real BAY Play screenshots and “${appTitle}”.`)
