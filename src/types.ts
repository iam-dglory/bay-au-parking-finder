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
 * one exists for this bay. Hardware ground truth, not a crowdsourced guess --
 * shown with higher confidence than a ping whenever both are present. */
export interface SensorStatus {
  status: 'present' | 'unoccupied'
  status_timestamp: string
  /** When the sensor itself last checked in at all, regardless of whether
   * its reading changed. The right signal for "is this sensor still
   * working" -- status_timestamp alone can't tell a long-parked car apart
   * from a sensor that's stopped reporting. */
  last_confirmed_at: string
  synced_at?: string
  match_method?: 'kerbside_id' | 'coordinate' | 'unknown'
}

export interface ParkingSpot {
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
  capacity: number
  census_year: number
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
