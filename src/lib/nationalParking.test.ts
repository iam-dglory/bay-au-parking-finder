import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAustraliaSearch } from './nationalParking'

afterEach(() => vi.unstubAllGlobals())

describe('national parking tiles', () => {
  it('recognises Australia without routing India to its catalog', () => {
    expect(isAustraliaSearch(-33.8688, 151.2093)).toBe(true)
    expect(isAustraliaSearch(13.0827, 80.2707)).toBe(false)
  })

  it('loads only nearby country tiles and does not claim live occupancy', async () => {
    vi.resetModules()
    const lat = 28.6139, lng = 77.209
    const key = `${Math.floor(lat / .1)}_${Math.floor(lng / .1)}`
    const row = { id: 'osm:node:1', kind: 'area', country: 'IN', address_text: 'Mapped parking', suburb: null, lat, lng, distance_m: 0, capacity: null, census_year: null, occupancy: 'not_provided' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('index.json')
      ? Response.json({ tile_size: .1, country: 'IN', tiles: [key] })
      : Response.json([row])))
    const { nationalNearby: nearby } = await import('./nationalParking')
    const result = await nearby('india', lat, lng, 500)
    expect(result).toHaveLength(1)
    expect(result[0].occupancy).toBe('not_provided')
  })

  it('keeps available tiles when a neighbouring tile fails to load', async () => {
    vi.resetModules()
    const lat = 28.6139, lng = 77.209
    const key = `${Math.floor(lat / .1)}_${Math.floor(lng / .1)}`
    const failed = `${Math.floor((lat - .02) / .1)}_${Math.floor(lng / .1)}`
    const row = { id: 'osm:node:partial', kind: 'area', country: 'IN', address_text: 'Mapped parking', suburb: null, lat, lng, distance_m: 0, capacity: null, census_year: null }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('index.json')
      ? Response.json({ tile_size: .1, country: 'IN', tiles: [key, failed] })
      : url.includes(`${failed}.json.gz`) ? new Response(null, { status: 503 }) : Response.json([row])))
    const { nationalNearby: nearby } = await import('./nationalParking')
    expect((await nearby('india', lat, lng, 3000)).map(item => item.id)).toEqual([row.id])
  })
})
