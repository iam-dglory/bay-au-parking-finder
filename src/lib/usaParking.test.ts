import { afterEach, describe, expect, it, vi } from 'vitest'
import { isUSSearch } from './usaParking'

afterEach(() => vi.unstubAllGlobals())

describe('US mapped parking', () => {
  it('routes the continental states, Alaska, Hawaii, and territories', () => {
    expect(isUSSearch(40.7128, -74.006)).toBe(true)
    expect(isUSSearch(61.2181, -149.9003)).toBe(true)
    expect(isUSSearch(21.3099, -157.8581)).toBe(true)
    expect(isUSSearch(18.4655, -66.1057)).toBe(true)
    expect(isUSSearch(-14.2781, -170.7025)).toBe(true)
    expect(isUSSearch(13.4757, 144.7489)).toBe(true)
    expect(isUSSearch(-37.8136, 144.9631)).toBe(false)
  })

  it('loads nearby state tiles, removes border duplicates, and keeps vacancy unclaimed', async () => {
    vi.resetModules()
    const x = Math.floor(40.7128 / .025)
    const y = Math.floor(-74.006 / .025)
    const key = `${x}_${y}`
    const row = { id: 'osm:way:100', kind: 'area', country: 'US', address_text: 'Mapped parking',
      suburb: null, lat: 40.7128, lng: -74.006, distance_m: 0, capacity: null,
      census_year: null, occupancy: 'not_provided' }
    const fetchMock = vi.fn(async (url: string) => url.endsWith('index.json')
      ? Response.json({ tile_size: .025, states: { 'new-york': [key], 'new-jersey': [key] } })
      : new Response(new Blob([JSON.stringify([row])]).stream().pipeThrough(new CompressionStream('gzip'))))
    vi.stubGlobal('fetch', fetchMock)
    const { usaNearby } = await import('./usaParking')
    const results = await usaNearby(40.7128, -74.006, 100)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(row.id)
    expect(results[0].occupancy).toBe('not_provided')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('accepts a tile decoded by the static host before the browser receives it', async () => {
    vi.resetModules()
    const key = `${Math.floor(34.0522 / .1)}_${Math.floor(-118.2437 / .1)}`
    const row = { id: 'osm:way:101', kind: 'area', country: 'US', address_text: 'Parking area',
      suburb: null, lat: 34.0522, lng: -118.2437, distance_m: 0, capacity: null,
      census_year: null, occupancy: 'not_provided' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('index.json')
      ? Response.json({ tile_size: .1, states: { california: [key] } })
      : Response.json([row])))
    const { usaNearby } = await import('./usaParking')
    expect((await usaNearby(row.lat, row.lng, 100)).map(area => area.id)).toEqual([row.id])
  })

  it('adds SFMTA meter locations without claiming vacancy or discarding mapped areas', async () => {
    vi.resetModules()
    const lat = 37.7749, lng = -122.4194
    const key = `${Math.floor(lat / .1)}_${Math.floor(lng / .1)}`
    const area = { id: 'osm:way:200', kind: 'area', country: 'US', lat, lng,
      address_text: 'Parking area', distance_m: 0, occupancy: 'not_provided' }
    const meter = { id: 'sfmta:meter:300', kind: 'bay', country: 'US', lat, lng,
      address_text: 'Metered parking', distance_m: 0, occupancy: 'not_provided',
      source_name: 'SFMTA meter inventory' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('usa/index.json')) return Response.json({ tile_size: .1, states: { california: [key] } })
      if (url.endsWith('sf-meters/index.json')) return Response.json({ tile_size: .1, tiles: [key] })
      if (url.includes('sf-meters/')) return Response.json([meter])
      return Response.json([area])
    }))
    const { usaNearby } = await import('./usaParking')
    const results = await usaNearby(lat, lng, 500)
    expect(results.map(row => row.id)).toEqual([area.id, meter.id])
    expect(results.every(row => row.occupancy === 'not_provided')).toBe(true)
  })

  it('surfaces a missing SF meter layer instead of silently showing incomplete coverage', async () => {
    vi.resetModules()
    const lat = 37.7749, lng = -122.4194
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('usa/index.json')) return Response.json({ tile_size: .1, states: {} })
      if (url.endsWith('sf-meters/index.json')) return new Response(null, { status: 503 })
      throw new Error(`Unexpected tile: ${url}`)
    }))
    const { usaNearby } = await import('./usaParking')
    await expect(usaNearby(lat, lng, 500)).rejects.toThrow('San Francisco meter locations could not load')
  })
})
