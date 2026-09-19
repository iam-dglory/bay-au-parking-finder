export type SignType =
  | 'FREE_UNLIMITED'
  | 'TIME_LIMITED'
  | 'PAID_METER'
  | 'PERMIT_ONLY'
  | 'NO_STOPPING_CLEARWAY'
  | 'LOADING_ZONE'
  | 'INFORMAL_TOLERATED'

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
}

export interface SpotStatusPing {
  status: 'occupied' | 'free'
  created_at: string
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
  rules: ParkingRule[]
  latest_ping: SpotStatusPing | null
  latest_claim: { expires_at: string } | null
}

export type UsabilityStatus = 'free' | 'paid' | 'restricted'

export interface SpotStatus {
  status: UsabilityStatus
  label: string
  detail: string
  price_per_hour: number | null
  changesAt: Date | null
  ruleApplied: ParkingRule | null
}

export const SIGN_TYPE_LABELS: Record<SignType, string> = {
  FREE_UNLIMITED: 'Free, no time limit',
  TIME_LIMITED: 'Free, time limited',
  PAID_METER: 'Paid / ticket parking',
  PERMIT_ONLY: 'Permit holders only',
  NO_STOPPING_CLEARWAY: 'No stopping (clearway)',
  LOADING_ZONE: 'Loading zone',
  INFORMAL_TOLERATED: 'Informally tolerated (no fixed rule)',
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
