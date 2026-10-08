import type { CarPark, ParkingSpot } from '../types'
import { haversineMeters } from './distance'

export interface IndiaCatalog { records: CarPark[] }
let catalog: Promise<IndiaCatalog> | undefined
const CITY_BOUNDS: Record<string, readonly [number, number, number, number]> = {
  Chennai: [12.4, 13.5, 79.5, 80.5],
  Bengaluru: [12.4, 13.4, 77.2, 78.0],
  Hyderabad: [16.8, 17.9, 77.8, 79.2],
}
export function isIndiaSearch(lat: number, lng: number) {
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98
}
export function nearbyCatalog(records: CarPark[], lat: number, lng: number, radius: number) {
  return records.filter(row => !row.parent_area_id).map(row => ({ ...row, distance_m: haversineMeters({ lat, lng }, row) }))
    .filter(row => row.distance_m <= radius).sort((a,b) => a.distance_m-b.distance_m)
}

/** Guard the published client catalog too, not just the import script. A bad
 * cached or future row is excluded rather than being sent to a driver. */
export function isUsableIndiaRecord(row: CarPark): boolean {
  const bounds = row.city ? CITY_BOUNDS[row.city] : undefined
  if (!bounds || row.country !== 'IN' || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return false
  const [minLat, maxLat, minLng, maxLng] = bounds
  if (row.lat < minLat || row.lat > maxLat || row.lng < minLng || row.lng > maxLng) return false
  if (!row.id || !row.address_text || !row.source_url || !row.source_name) return false
  if (['private', 'no', 'permit', 'delivery', 'emergency'].includes(row.access ?? '')) return false
  if (row.tariffs?.length && (!row.pricing_source_url || !row.pricing_checked_at || row.tariffs.some((tariff) => !Number.isFinite(tariff.amount) || tariff.amount < 0))) return false
  return true
}
export async function indiaNearby(lat: number, lng: number, radius: number) {
  if (!isIndiaSearch(lat,lng)) return []
  catalog ??= fetch(`${import.meta.env.BASE_URL}data/india-parking.json`, { signal: AbortSignal.timeout(12000) }).then(async response => {
    if (!response.ok) throw new Error('India parking locations could not be loaded. Please refresh.')
    return response.json() as Promise<IndiaCatalog>
  }).catch(error => { catalog = undefined; throw error })
  return nearbyCatalog((await catalog).records.filter(isUsableIndiaRecord),lat,lng,radius)
}
export function catalogSpot(row: CarPark): ParkingSpot {
  return { ...row, country:row.country ?? 'IN', state:null, created_by:'catalog', photo_url:null, moderation_status:'approved', kerbside_id:null, rules:[], latest_ping:null, sensor_status:null, catalog:row }
}
