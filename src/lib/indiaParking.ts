import type { CarPark, ParkingSpot } from '../types'
import { haversineMeters } from './distance'

export interface IndiaCatalog { records: CarPark[] }
let catalog: Promise<IndiaCatalog> | undefined
export function isIndiaSearch(lat: number, lng: number) {
  return lat >= 6 && lat <= 37 && lng >= 68 && lng <= 98
}
export function nearbyCatalog(records: CarPark[], lat: number, lng: number, radius: number) {
  return records.map(row => ({ ...row, distance_m: haversineMeters({ lat, lng }, row) }))
    .filter(row => row.distance_m <= radius).sort((a,b) => a.distance_m-b.distance_m)
}
export async function indiaNearby(lat: number, lng: number, radius: number) {
  if (!isIndiaSearch(lat,lng)) return []
  catalog ??= fetch(`${import.meta.env.BASE_URL}data/india-parking.json`).then(async response => {
    if (!response.ok) throw new Error('India parking locations could not be loaded. Please refresh.')
    return response.json() as Promise<IndiaCatalog>
  }).catch(error => { catalog = undefined; throw error })
  return nearbyCatalog((await catalog).records,lat,lng,radius)
}
export function catalogSpot(row: CarPark): ParkingSpot {
  return { ...row, country:'IN', state:null, created_by:'catalog', photo_url:null, moderation_status:'approved', kerbside_id:null, rules:[], latest_ping:null, sensor_status:null, catalog:row }
}
