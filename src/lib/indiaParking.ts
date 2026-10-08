import type { CarPark, ParkingSpot } from '../types'
import { haversineMeters } from './distance'
import { nationalNearby } from './nationalParking'

interface IndiaCatalog { records: CarPark[] }
let legacyCatalog: Promise<IndiaCatalog> | undefined

export function isIndiaSearch(lat: number, lng: number) {
  return lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 98.5
}
export function nearbyCatalog(records: CarPark[], lat: number, lng: number, radius: number) {
  return records.filter(row => !row.parent_area_id).map(row => ({ ...row, distance_m: haversineMeters({ lat, lng }, row) }))
    .filter(row => row.distance_m <= radius).sort((a,b) => a.distance_m-b.distance_m)
}

/** Guard the published client catalog too, not just the import script. A bad
 * cached or future row is excluded rather than being sent to a driver. */
export function isUsableIndiaRecord(row: CarPark): boolean {
  if (row.country !== 'IN' || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return false
  if (!isIndiaSearch(row.lat, row.lng) || !row.state || !row.id || !row.address_text || !row.source_url || !row.source_name) return false
  if (['private', 'no', 'permit', 'delivery', 'emergency', 'agricultural', 'forestry'].includes(row.access ?? '')) return false
  if (row.tariffs?.length && (!row.pricing_source_url || !row.pricing_checked_at || row.tariffs.some((tariff) => !Number.isFinite(tariff.amount) || tariff.amount < 0))) return false
  return true
}
async function legacyIndiaNearby(lat: number, lng: number, radius: number) {
  legacyCatalog ??= fetch(`${import.meta.env.BASE_URL}data/india-parking.json`, { signal: AbortSignal.timeout(12000) }).then(async response => {
    if (!response.ok) throw new Error('India parking locations could not be loaded. Please refresh.')
    return response.json() as Promise<IndiaCatalog>
  }).catch(error => { legacyCatalog = undefined; throw error })
  return nearbyCatalog((await legacyCatalog).records.filter(isUsableIndiaRecord), lat, lng, radius)
}
export async function indiaNearby(lat: number, lng: number, radius: number) {
  if (!isIndiaSearch(lat,lng)) return []
  try {
    return (await nationalNearby('india', lat, lng, radius)).filter(isUsableIndiaRecord)
  } catch {
    // Keep the reviewed three-city catalog available until the national index
    // has been successfully published. This avoids a rollout gap on the app.
    return legacyIndiaNearby(lat, lng, radius)
  }
}
export function catalogSpot(row: CarPark): ParkingSpot {
  return { ...row, country:row.country ?? 'IN', state:null, created_by:'catalog', photo_url:null, moderation_status:'approved', kerbside_id:null, rules:[], latest_ping:null, sensor_status:null, catalog:row }
}
