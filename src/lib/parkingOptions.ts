import type { ParkingSpot } from '../types'
import { availability } from './availability'
import { haversineMeters } from './distance'
import { carParkCost, streetCostRange, type CarParkRates, type LocalStart, type WeekSchedule } from './parkingCost'
import { publicAssetUrl } from './publicAssets'
import { navigationUrl } from './navigation'

/* ---------- data files (generated / curated, see scripts/ and docs) ---------- */

export interface StreetRatesFile {
  fetched: string
  zones: Record<string, { days: WeekSchedule; monday_inferred?: boolean }>
  streets: Record<string, { segment: number; zones: number[]; exact: boolean; same_price: boolean }>
}
export interface CarParkRecord {
  id: string; name: string; operator: string
  lat: number | null; lng: number | null
  /** Where cars drive in, when it differs from the building pin. */
  entrance?: { lat: number; lng: number }
  source_url: string; checked: string; notes?: string
  rates: CarParkRates
}
export interface CarParkRatesFile { stale_after_days: number; car_parks: CarParkRecord[] }

const cache = new Map<string, Promise<unknown>>()
function loadJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(path, fetch(publicAssetUrl(path), { signal: AbortSignal.timeout(12000) }).then(r => {
      if (!r.ok) throw new Error(`Could not load ${path}`)
      return r.json()
    }).catch(error => { cache.delete(path); throw error }))
  }
  return cache.get(path) as Promise<T>
}
export const loadStreetRates = () => loadJson<StreetRatesFile>('data/melbourne/street-rates.json')
export const loadCarParkRates = () => loadJson<CarParkRatesFile>('data/melbourne/car-park-rates.json')

/* ---------- options shown to the driver ---------- */

export interface ParkingOption {
  kind: 'street' | 'carpark'
  id: string
  name: string
  operator?: string
  lat: number
  lng: number
  /** Where to send navigation (a car park's vehicle entrance), if not lat/lng. */
  navTo?: { lat: number; lng: number }
  distanceM: number
  /** Exact total for the stay, or null when unknown. */
  cents: number | null
  /** Set when several pay zones share a street and prices differ. */
  range?: { min: number; max: number }
  rateName?: string
  /** Longest stay allowed from now, in minutes (street time limits). */
  limitMinutes: number | null
  /** false = the chosen stay is longer than the limit. */
  fits: boolean | null
  /** Live council sensor readings that are fresh and not stuck. */
  live?: { free: number; reporting: number }
  bayCount?: number
  bays?: ParkingSpot[]
  /** Paid periods within the stay (exact streets only), minutes after arrival. */
  segments?: { fromMinute: number; toMinute: number; centsPerHour: number }[]
  source: { label: string; url?: string; date: string; stale?: boolean }
  notes?: string
}

const DAY_MS = 86_400_000

export function streetOptions(spots: ParkingSpot[], rates: StreetRatesFile | null, start: LocalStart, durationMinutes: number, now: Date): ParkingOption[] {
  const groups = new Map<string, ParkingSpot[]>()
  for (const spot of spots) {
    if (spot.catalog) continue
    const list = groups.get(spot.address_text)
    if (list) list.push(spot)
    else groups.set(spot.address_text, [spot])
  }
  const options: ParkingOption[] = []
  for (const [name, bays] of groups) {
    const lat = bays.reduce((s, b) => s + b.lat, 0) / bays.length
    const lng = bays.reduce((s, b) => s + b.lng, 0) / bays.length
    const states = bays.map(b => availability(b, now).state)
    const reporting = states.filter(s => s === 'vacant' || s === 'occupied').length
    const street = rates?.streets[name]
    const base = {
      kind: 'street' as const, id: `street:${name}`, name, lat, lng,
      distanceM: Math.min(...bays.map(b => b.distance_m)),
      live: reporting ? { free: states.filter(s => s === 'vacant').length, reporting } : undefined,
      bayCount: bays.length, bays,
    }
    if (!street || !rates) {
      options.push({ ...base, cents: null, limitMinutes: null, fits: null, rateName: 'No meter listed', source: { label: 'Check the sign at the bay', date: rates?.fetched ?? '' } })
      continue
    }
    const schedules = street.zones.map(z => rates.zones[String(z)]?.days).filter((d): d is WeekSchedule => !!d)
    const cost = streetCostRange(schedules, start, durationMinutes)
    const limit = cost.maxStayMinutes
    options.push({
      ...base,
      cents: cost.exact || cost.minCents === cost.maxCents ? cost.maxCents : null,
      range: cost.minCents !== cost.maxCents ? { min: cost.minCents, max: cost.maxCents } : undefined,
      rateName: cost.maxCents === 0 ? 'Free at this time' : 'Meter',
      limitMinutes: limit,
      fits: limit == null ? true : durationMinutes <= limit,
      source: { label: 'City of Melbourne Pay Stay data', url: 'https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-parking-restrictions/', date: rates.fetched },
      segments: cost.results.length === 1 ? cost.results[0].segments : undefined,
      notes: street.exact ? undefined : 'Prices or time limits differ along this street. Check the meter.',
    })
  }
  return options
}

export function carParkOptions(file: CarParkRatesFile | null, center: { lat: number; lng: number }, radiusM: number, start: LocalStart, durationMinutes: number, now: Date): ParkingOption[] {
  if (!file) return []
  const options: ParkingOption[] = []
  for (const park of file.car_parks) {
    if (park.lat == null || park.lng == null) continue
    const distanceM = haversineMeters(center, { lat: park.lat, lng: park.lng })
    if (distanceM > radiusM) continue
    const cost = carParkCost(park.rates, start, durationMinutes)
    const ageDays = (now.getTime() - Date.parse(park.checked)) / DAY_MS
    options.push({
      kind: 'carpark', id: park.id, name: park.name, operator: park.operator, lat: park.lat, lng: park.lng, navTo: park.entrance, distanceM,
      cents: cost?.cents ?? null, rateName: cost?.rateName ?? 'No published rate for this time',
      limitMinutes: null, fits: cost ? true : null,
      source: { label: park.operator, url: park.source_url, date: park.checked, stale: ageDays > file.stale_after_days },
      notes: park.notes,
    })
  }
  return options
}

/** Cheapest stays that fit first, then by distance; unknown prices last. */
export function rankOptions(options: ParkingOption[]): ParkingOption[] {
  const price = (o: ParkingOption) => o.cents ?? o.range?.max ?? null
  const bucket = (o: ParkingOption) => o.fits === false ? 2 : price(o) == null ? 1 : 0
  return [...options].sort((a, b) => bucket(a) - bucket(b) || (price(a) ?? 0) - (price(b) ?? 0) || a.distanceM - b.distanceM)
}

/** Driving directions in the driver's chosen navigation app. */
export function directionsUrl(lat: number, lng: number) {
  return navigationUrl(lat, lng)
}

/** "Queen Street between La Trobe Street and A'Beckett Street" -> "Queen St · La Trobe–A'Beckett". */
export function shortStreetName(name: string): string {
  const abbreviate = (part: string) => part.replace(/\bStreet\b/g, 'St').replace(/\bRoad\b/g, 'Rd').replace(/\bLane\b/g, 'Ln').replace(/\bParade\b/g, 'Pde').replace(/\bAvenue\b/g, 'Ave').replace(/\bPlace\b/g, 'Pl').trim()
  const match = name.match(/^(.*?) between (.*?) and (.*)$/)
  if (!match) return abbreviate(name)
  const cross = (part: string) => abbreviate(part).replace(/ (St|Rd|Ln|Pde|Ave|Pl)$/, '')
  return `${abbreviate(match[1])} · ${cross(match[2])}–${cross(match[3])}`
}

/** "Can I park here?": the street option whose nearest bay is within
 * `maxM` of the driver. GPS is often 10-30 m off in the CBD, so the default
 * radius is 40 m; anything further is not "here". */
export function streetOptionHere(options: ParkingOption[], point: { lat: number; lng: number }, maxM = 40): { option: ParkingOption; distanceM: number } | null {
  let best: { option: ParkingOption; distanceM: number } | null = null
  for (const option of options) {
    if (option.kind !== 'street' || !option.bays) continue
    for (const bay of option.bays) {
      const d = haversineMeters(point, { lat: bay.lat, lng: bay.lng })
      if (d <= maxM && (!best || d < best.distanceM)) best = { option, distanceM: d }
    }
  }
  return best
}

/** "Queen Street between La Trobe Street and A'Beckett Street" -> { title: "Queen St", block: "Between La Trobe St and A'Beckett St" }. */
export function splitStreet(name: string): { title: string; block?: string } {
  const short = (part: string) => part.replace(/\bStreet\b/g, 'St').replace(/\bLane\b/g, 'Ln').replace(/\bRoad\b/g, 'Rd').replace(/\bParade\b/g, 'Pde').replace(/\bAvenue\b/g, 'Ave').replace(/\bPlace\b/g, 'Pl')
  const m = name.match(/^(.*?) between (.*?) and (.*)$/)
  if (!m) return { title: short(name) }
  return { title: short(m[1]), block: `Between ${short(m[2])} and ${short(m[3])}` }
}

/** Walking minutes at a relaxed city pace (80 m a minute), never below 1. */
export const walkMinutes = (metres: number) => Math.max(1, Math.round(metres / 80))
