import type { CarPark } from '../types'
import { nearbyCatalog } from './indiaParking'

interface UsIndex { tile_size: number; states: Record<string, string[]> }
interface SfMeterIndex { tile_size: number; tiles: string[] }
let index: Promise<{ size: number; byTile: Map<string, string[]> }> | undefined
const loaded = new Map<string, Promise<CarPark[]>>()
let sfIndex: Promise<SfMeterIndex> | undefined
const sfLoaded = new Map<string, Promise<CarPark[]>>()

function isSanFrancisco(lat: number, lng: number) {
  return lat > 37.6 && lat < 37.85 && lng > -122.55 && lng < -122.3
}

async function readCompressedTile(path: string): Promise<CarPark[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Mapped US parking locations could not load. Please refresh.')
  const payload = await response.arrayBuffer()
  const bytes = new Uint8Array(payload)
  // Static hosts vary: some transparently decode .gz and some return gzip.
  const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b
  if (compressed && typeof DecompressionStream === 'undefined')
    throw new Error('This browser cannot read the US parking catalog. Please update your browser.')
  const text = compressed
    ? await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    : new TextDecoder().decode(payload)
  return JSON.parse(text) as CarPark[]
}

async function sfMeterNearby(lat: number, lng: number, radius: number): Promise<CarPark[]> {
  if (!isSanFrancisco(lat, lng)) return []
  sfIndex ??= fetch(`${import.meta.env.BASE_URL}data/sf-meters/index.json`, { signal: AbortSignal.timeout(12000) })
    .then(async response => {
      if (!response.ok) throw new Error('San Francisco meter locations could not load.')
      return response.json() as Promise<SfMeterIndex>
    }).catch(error => { sfIndex = undefined; throw error })
  const { tile_size: size, tiles } = await sfIndex
  const known = new Set(tiles)
  const latDelta = radius / 111000
  const lngDelta = radius / Math.max(10000, 111000 * Math.cos(lat * Math.PI / 180))
  const wanted: string[] = []
  for (let x = Math.floor((lat - latDelta) / size); x <= Math.floor((lat + latDelta) / size); x++) {
    for (let y = Math.floor((lng - lngDelta) / size); y <= Math.floor((lng + lngDelta) / size); y++) {
      const key = `${x}_${y}`
      if (known.has(key)) wanted.push(key)
    }
  }
  const rows = await Promise.all(wanted.map(key => {
    if (!sfLoaded.has(key)) sfLoaded.set(key, readCompressedTile(`sf-meters/${key}.json.gz`)
      .catch(error => { sfLoaded.delete(key); throw error }))
    return sfLoaded.get(key)!
  }))
  for (const key of sfLoaded.keys()) if (!wanted.includes(key)) sfLoaded.delete(key)
  return nearbyCatalog(rows.flat(), lat, lng, radius)
}

/** Routing bounds only. Actual coverage comes from the archived state tiles. */
export function isUSSearch(lat: number, lng: number) {
  return (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66)
    || (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -129)
    || (lat >= -18 && lat <= 30 && lng >= -180 && lng <= -154)
    || (lat >= 17 && lat <= 19 && lng >= -68 && lng <= -64)
    || (lat >= 0 && lat <= 25 && lng >= 140 && lng <= 175)
}

async function tileIndex() {
  index ??= fetch(`${import.meta.env.BASE_URL}data/usa/index.json`, { signal: AbortSignal.timeout(12000) })
    .then(async response => {
      if (!response.ok) throw new Error('US parking locations could not load. Please refresh.')
      const data = await response.json() as UsIndex
      const byTile = new Map<string, string[]>()
      for (const [state, keys] of Object.entries(data.states)) {
        for (const key of keys) byTile.set(key, [...(byTile.get(key) ?? []), state])
      }
      if (!(data.tile_size > 0)) throw new Error('US parking tile index is invalid.')
      return { size: data.tile_size, byTile }
    }).catch(error => { index = undefined; throw error })
  return index
}

export async function usaNearby(lat: number, lng: number, radius: number): Promise<CarPark[]> {
  if (!isUSSearch(lat, lng)) return []
  const { size, byTile } = await tileIndex()
  const latDelta = radius / 111000
  const lngDelta = radius / Math.max(10000, 111000 * Math.cos(lat * Math.PI / 180))
  const wanted: string[] = []
  for (let x = Math.floor((lat - latDelta) / size); x <= Math.floor((lat + latDelta) / size); x++) {
    for (let y = Math.floor((lng - lngDelta) / size); y <= Math.floor((lng + lngDelta) / size); y++) {
      const key = `${x}_${y}`
      for (const state of byTile.get(key) ?? []) wanted.push(`${state}/${key}`)
    }
  }
  const rows = await Promise.all(wanted.map(key => {
    if (!loaded.has(key)) loaded.set(key, readCompressedTile(`usa/${key}.json.gz`)
      .catch(error => { loaded.delete(key); throw error }))
    return loaded.get(key)!
  }))
  for (const key of loaded.keys()) if (!wanted.includes(key)) loaded.delete(key)
  const unique = new Map<string, CarPark>()
  for (const row of rows.flat()) unique.set(row.id, row)
  const mapped = nearbyCatalog([...unique.values()], lat, lng, radius)
  // SFMTA publishes exact meter locations, but not a live vacancy or the full
  // sign/rate schedule. Keep those records distinct from OSM parking areas.
  return [...mapped, ...await sfMeterNearby(lat, lng, radius)].sort((a, b) => a.distance_m - b.distance_m)
}
