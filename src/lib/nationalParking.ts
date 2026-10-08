import type { CarPark } from '../types'
import { haversineMeters } from './distance'

interface NationalIndex {
  tile_size: number
  country: 'IN' | 'AU'
  tiles: string[]
}

const indexes = new Map<'india' | 'australia', Promise<NationalIndex>>()
const tiles = new Map<string, Promise<CarPark[]>>()

async function readTile(path: string): Promise<CarPark[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Mapped parking locations could not load. Please refresh.')
  const payload = await response.arrayBuffer()
  const bytes = new Uint8Array(payload)
  const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b
  if (compressed && typeof DecompressionStream === 'undefined') throw new Error('This browser cannot read the parking catalog. Please update your browser.')
  const text = compressed
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    : new TextDecoder().decode(payload)
  return JSON.parse(text) as CarPark[]
}

function indexFor(country: 'india' | 'australia') {
  if (!indexes.has(country)) {
    indexes.set(country, fetch(`${import.meta.env.BASE_URL}data/${country}/index.json`, { signal: AbortSignal.timeout(12000) })
      .then(async response => {
        if (!response.ok) throw new Error('Parking coverage could not load. Please refresh.')
        const index = await response.json() as NationalIndex
        if (!(index.tile_size > 0) || !Array.isArray(index.tiles)) throw new Error('Parking coverage index is invalid.')
        return index
      }).catch(error => { indexes.delete(country); throw error }))
  }
  return indexes.get(country)!
}

export function isAustraliaSearch(lat: number, lng: number) {
  return lat >= -55 && lat <= -8 && lng >= 95 && lng <= 170
}

export async function nationalNearby(country: 'india' | 'australia', lat: number, lng: number, radius: number): Promise<CarPark[]> {
  const index = await indexFor(country)
  const known = new Set(index.tiles)
  const latDelta = radius / 111000
  const lngDelta = radius / Math.max(10000, 111000 * Math.cos(lat * Math.PI / 180))
  const wanted: string[] = []
  for (let x = Math.floor((lat - latDelta) / index.tile_size); x <= Math.floor((lat + latDelta) / index.tile_size); x++) {
    for (let y = Math.floor((lng - lngDelta) / index.tile_size); y <= Math.floor((lng + lngDelta) / index.tile_size); y++) {
      const tile = `${x}_${y}`
      if (known.has(tile)) wanted.push(tile)
    }
  }
  const rows = await Promise.all(wanted.map(tile => {
    const key = `${country}/${tile}`
    if (!tiles.has(key)) tiles.set(key, readTile(`${country}/${tile}.json.gz`).catch(error => { tiles.delete(key); throw error }))
    return tiles.get(key)!
  }))
  for (const key of tiles.keys()) if (key.startsWith(`${country}/`) && !wanted.includes(key.slice(country.length + 1))) tiles.delete(key)
  return rows.flat().filter(row => !row.parent_area_id)
    .map(row => ({ ...row, distance_m: haversineMeters({ lat, lng }, row) }))
    .filter(row => row.distance_m <= radius)
    .sort((a, b) => a.distance_m - b.distance_m)
}
