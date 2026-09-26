import type { CarPark, ParkingSpot } from '../types'
import { haversineMeters } from './distance'
import { indiaNearby, nearbyCatalog } from './indiaParking'
import { isMelbourneSearch } from './melbourneSensors'

interface TileIndex { tile_size: number; tiles: string[] }
let index: Promise<TileIndex> | undefined
const tiles = new Map<string, Promise<CarPark[]>>()
async function json<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, {signal: AbortSignal.timeout(12000)})
  if (!response.ok) throw new Error('Mapped parking locations could not load. Please refresh.')
  return response.json() as Promise<T>
}
export async function regionalNearby(lat: number, lng: number, radius: number): Promise<CarPark[]> {
  if (!isMelbourneSearch(lat,lng)) return indiaNearby(lat,lng,radius)
  index ??= json<TileIndex>('melbourne/index.json').catch(error => { index = undefined; throw error })
  const meta = await index
  const latDelta = radius / 111000, lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180))
  const wanted: string[] = [], known = new Set(meta.tiles)
  for (let x=Math.floor((lat-latDelta)/meta.tile_size);x<=Math.floor((lat+latDelta)/meta.tile_size);x++) {
    for (let y=Math.floor((lng-lngDelta)/meta.tile_size);y<=Math.floor((lng+lngDelta)/meta.tile_size);y++) {
      const key=`${x}_${y}`
      if (known.has(key)) wanted.push(key)
    }
  }
  const rows = await Promise.all(wanted.map(key => {
    if (!tiles.has(key)) tiles.set(key,json<CarPark[]>(`melbourne/${key}.json`).catch(error => { tiles.delete(key); throw error }))
    return tiles.get(key)!
  }))
  // Retain only nearby tiles while navigating, rather than growing an unbounded mobile cache.
  for (const key of tiles.keys()) if (!wanted.includes(key)) tiles.delete(key)
  return nearbyCatalog(rows.flat(),lat,lng,radius)
}
/** Remove only co-located catalog bays. This is visual deduplication, never
 * a sensor or sign assignment: council evidence remains attached to its ID. */
export function mergeMappedBays(remote: ParkingSpot[], local: ParkingSpot[]): ParkingSpot[] {
  const grid=new Map<string,ParkingSpot[]>()
  const key=(lat:number,lng:number)=>`${Math.floor(lat/.00004)}_${Math.floor(lng/.00004)}`
  for (const spot of remote) { const k=key(spot.lat,spot.lng); grid.set(k,[...(grid.get(k) ?? []),spot]) }
  return [...remote,...local.filter(spot => {
    const x=Math.floor(spot.lat/.00004), y=Math.floor(spot.lng/.00004)
    for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) {
      if ((grid.get(`${x+dx}_${y+dy}`) ?? []).some(other=>haversineMeters(spot,other)<=2)) return false
    }
    return true
  })].sort((a,b)=>a.distance_m-b.distance_m)
}

/** Only explicit, reviewed census/operator aliases are replaced. A nearby car
 * park is not evidence that two facilities are the same. Preserve the census
 * fallback if its current operator record could not load. */
export function mergeParkingAreas(census: CarPark[], local: CarPark[]): CarPark[] {
  const areas=local.filter(row=>row.kind==='area' && !row.parent_area_id)
  return [...census.filter(row=>!areas.some(area=>
    row.census_year != null && row.census_year<=2024 &&
    area.census_aliases?.includes(row.address_text) && haversineMeters(row,area)<=150
  )),...areas].sort((a,b)=>a.distance_m-b.distance_m)
}
