export type SignType =
  | 'FREE_UNLIMITED'
  | 'TIME_LIMITED'
  | 'PAID_METER'
  | 'PERMIT_ONLY'
  | 'NO_STOPPING_CLEARWAY'
  | 'LOADING_ZONE'
  | 'INFORMAL_TOLERATED'
  | 'ACCESSIBLE_PERMIT'

export interface ParkingRule {
  id: string
  sign_type: SignType
  max_stay_minutes: number | null
  /** 0 = Sunday ... 6 = Saturday, matching JS Date.getDay() */
  days_active: number[]
  time_from: string | null
  time_to: string | null
  price_per_hour: number | null
  currency: string | null
  notes: string | null
  match_method?: 'reported' | 'segment' | 'bay_id' | 'sign_coordinate' | 'field_verified' | 'unverified'
}

export interface SpotStatusPing {
  status: 'occupied' | 'free'
  created_at: string
  /** How many distinct people reported the same status within the freshness
   * window. Lets a viewer judge confidence instead of trusting one tap. */
  corroborating_count: number
  /** Optional photo attached when marking a spot occupied, as proof it's
   * actually a car in the spot, not just an anonymous claim. */
  photo_url: string | null
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected'

/** Real occupancy reading from a council-installed in-ground sensor, where
 * one exists for this bay. Requires an exact bay match and a recent source update before use. */
export interface SensorStatus {
  sensor_kerbside_id?: string | number
  status: 'present' | 'unoccupied'
  status_timestamp: string
  /** Council feed lastupdated timestamp. This is source freshness, not a
   * guarantee of arrival-time vacancy or a separately measured device heartbeat. */
  last_confirmed_at: string
  synced_at?: string
  match_method?: 'kerbside_id' | 'coordinate' | 'unknown'
}

export interface ParkingSpot {
  catalog?: CarPark
  id: string
  address_text: string
  suburb: string | null
  state: string | null
  country: string | null
  lat: number
  lng: number
  distance_m: number
  created_by: string
  photo_url: string | null
  moderation_status: ModerationStatus
  /** The council's own reference number for this bay, where published --
   * likely (not confirmed) the same number marked on the physical kerb for
   * Pay Stay bays. Only populated for the subset of Melbourne's own dataset
   * that includes it, not a universal field. */
  kerbside_id: string | null
  rules: ParkingRule[]
  latest_ping: SpotStatusPing | null
  sensor_status: SensorStatus | null
}

export type UsabilityStatus = 'free' | 'paid' | 'restricted' | 'unknown'

export interface SpotStatus {
  status: UsabilityStatus
  label: string
  detail: string
  price_per_hour: number | null
  changesAt: Date | null
  ruleApplied: ParkingRule | null
  /** IANA zone the status was evaluated in (the spot's own location, not the
   * viewer's device) — needed so "changesAt" displays in the right local time
   * when checking a spot in a different timezone. */
  timeZone: string | undefined
}

export const SIGN_TYPE_LABELS: Record<SignType, string> = {
  FREE_UNLIMITED: 'Free, no time limit',
  TIME_LIMITED: 'Free, time limited',
  PAID_METER: 'Paid / ticket parking',
  PERMIT_ONLY: 'Permit holders only',
  NO_STOPPING_CLEARWAY: 'No stopping (clearway)',
  LOADING_ZONE: 'Loading zone',
  INFORMAL_TOLERATED: 'Informally tolerated (no fixed rule)',
  ACCESSIBLE_PERMIT: 'Accessible permit holders only',
}

/** A public/commercial off-street car park (multi-storey building or lot),
 * from City of Melbourne's annual CLUE property census. Deliberately not a
 * ParkingSpot: it's one point per building with a total space count, not a
 * per-bay legal rule, and the council doesn't publish live availability for
 * these -- capacity only, no "is it free right now" signal. */
export interface CarPark {
  id: string
  address_text: string
  suburb: string | null
  lat: number
  lng: number
  distance_m: number
  capacity: number | null
  census_year: number | null
  kind?: 'bay' | 'area'
  /** Source spaces remain stored but display through their off-street facility. */
  parent_area_id?: string
  mapped_bay_count?: number
  facility_type?: string
  opening_hours_summary?: string
  entrance_summary?: string
  directions_query?: string
  boundary?: [number, number][]
  census_aliases?: string[]
  city?: string
  country?: string
  access?: string
  fee?: string | null
  opening_hours?: string | null
  vehicle_types?: string
  source_url?: string
  source_name?: string
  source_updated_at?: string
  collected_at?: string
  location_note?: string
  occupancy?: 'not_provided' | 'operator_snapshot'
  occupancy_snapshot?: { source_url: string; fetched_at: string; vehicles: Record<string,{capacity:number;occupied:number;available:number}> }
  pricing_checked_at?: string
  tariffs?: { vehicle: string; period: string; amount: number; category?: string; conditions?: string }[]
  price_summary?: string | null
  price_summary_conditions?: string
  vehicle_capacity?: Record<string,number>
  location_source_url?: string
  mapped_zone?: boolean
  source_terms?: Record<string,string>
  hourly_rate_min?: number | null
  hourly_rate_max?: number | null
  currency?: string | null
  pricing_notes?: string | null
  pricing_source_url?: string | null
}

export interface SpotVisit {
  id: string
  user_id: string
  kind: 'free_sign'
  ref_id: string
  address_text: string
  country: string | null
  visited_at: string
}

export const CURRENCY_OPTIONS: { code: string; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
]
