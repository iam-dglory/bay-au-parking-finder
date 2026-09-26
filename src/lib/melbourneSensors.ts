import type { ParkingSpot, SensorStatus } from '../types'
import { haversineMeters } from './distance'

export interface CouncilSensor {
  kerbsideid: number
  status_description: string
  status_timestamp: string
  lastupdated: string
  location: { lat: number; lon: number }
}
export const MELBOURNE_SENSOR_SOURCE = 'https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/'
export function isMelbourneSearch(lat: number, lng: number) {
  return lat >= -38.5 && lat <= -37.3 && lng >= 144.3 && lng <= 145.7
}
export async function fetchMelbourneSensors(lat: number, lng: number, radius: number): Promise<CouncilSensor[]> {
  if (!isMelbourneSearch(lat, lng)) return []
  const params = new URLSearchParams({ where: `within_distance(location, GEOM'POINT(${lng} ${lat})', ${radius}m)` })
  const response = await fetch(`https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json?${params}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Council availability feed could not refresh.')
  const rows: unknown = await response.json()
  if (!Array.isArray(rows)) throw new Error('Council availability feed returned an unexpected response.')
  return rows as CouncilSensor[]
}
/** Join only the council's own identifiers. Never guess the adjacent bay.
 * Supplemental sensor locations are published council points, not invented bays. */
export function mergeMelbourneSensors(spots: ParkingSpot[], sensors: CouncilSensor[], center: {lat:number;lng:number}, syncedAt: string): ParkingSpot[] {
  const byId = new Map<string, CouncilSensor>()
  for (const row of sensors) {
    if (!Number.isInteger(row.kerbsideid) || !Number.isFinite(row.location?.lat) || !Number.isFinite(row.location?.lon) || !isMelbourneSearch(row.location.lat,row.location.lon) || !Number.isFinite(Date.parse(row.lastupdated))) continue
    const previous = byId.get(String(row.kerbsideid))
    if (!previous || Date.parse(row.lastupdated) > Date.parse(previous.lastupdated)) byId.set(String(row.kerbsideid), row)
  }
  const reading = (row: CouncilSensor): SensorStatus | null => {
    if (!['Present', 'Unoccupied'].includes(row.status_description)) return null
    return { status: row.status_description === 'Present' ? 'present' : 'unoccupied', sensor_kerbside_id: String(row.kerbsideid), status_timestamp: row.status_timestamp, last_confirmed_at: row.lastupdated, synced_at: syncedAt, match_method: 'kerbside_id' }
  }
  const matched = new Set<string>()
  const closest = new Map<string, ParkingSpot>()
  for (const spot of spots) {
    const row = spot.kerbside_id ? byId.get(spot.kerbside_id) : undefined
    if (!row || haversineMeters(spot,{lat:row.location.lat,lng:row.location.lon}) > 15) continue
    const current = closest.get(spot.kerbside_id!)
    if (!current || haversineMeters(spot,{lat:row.location.lat,lng:row.location.lon}) < haversineMeters(current,{lat:row.location.lat,lng:row.location.lon})) closest.set(spot.kerbside_id!,spot)
  }
  // A displaced or duplicated stored council ID is not a second publishable bay.
  const result = spots.filter(spot => {
    const row = spot.kerbside_id ? byId.get(spot.kerbside_id) : undefined
    return !row || closest.get(spot.kerbside_id!)?.id === spot.id
  }).map(spot => {
    const row = spot.kerbside_id ? byId.get(spot.kerbside_id) : undefined
    if (!row || closest.get(spot.kerbside_id!)?.id !== spot.id) return { ...spot, sensor_status: null }
    matched.add(String(row.kerbsideid))
    return { ...spot, sensor_status: reading(row) }
  })
  for (const [id, row] of byId) {
    if (matched.has(id)) continue
    const lat = row.location.lat, lng = row.location.lon
    result.push({ id: `council-sensor:${id}`, address_text: `Council parking bay · ${id}`, suburb: 'Melbourne', state: 'VIC', country: 'Australia', lat, lng, distance_m: haversineMeters(center, {lat,lng}), created_by: 'council', photo_url: null, moderation_status: 'approved', kerbside_id: id, rules: [], latest_ping: null, sensor_status: reading(row) })
  }
  return result.sort((a,b) => a.distance_m - b.distance_m)
}
