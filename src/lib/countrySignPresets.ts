import type { SignType } from '../types'

export interface SignOption {
  type: SignType
  label: string
  hint: string
}

/**
 * What counts as a "parking sign" varies enormously by country — Australia has
 * formal, standardised plates (2P, clearways); India's on-street parking is
 * mostly informal and tolerated rather than signed; the US/UK sit in between.
 * Each preset maps that country's real vocabulary onto the same underlying
 * SignType enum, so the evaluation logic stays universal while the words a
 * reporter sees match what's actually on the ground where they are.
 */
export const GENERIC_SIGN_OPTIONS: SignOption[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, no restrictions', hint: 'Anyone can park here, no limit' },
  { type: 'TIME_LIMITED', label: 'Free, time limited', hint: 'Free, but only for a set number of hours' },
  { type: 'PAID_METER', label: 'Paid parking', hint: 'Meter, ticket machine, or pay-by-app' },
  { type: 'PERMIT_ONLY', label: 'Permit / residents only', hint: 'Restricted to permit holders' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'No parking / no stopping', hint: 'Not allowed at all, or only at certain times' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Accessible parking permit', hint: 'Reserved for holders of a disability/accessible parking permit' },
]

const AUSTRALIA_SIGN_OPTIONS: SignOption[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, no limit', hint: 'Plain "P" sign, no restrictions' },
  { type: 'TIME_LIMITED', label: 'Free, time limited', hint: 'e.g. 1P, 2P, 4P signs' },
  { type: 'PAID_METER', label: 'Paid / ticket', hint: 'Meter or pay-by-app parking' },
  { type: 'PERMIT_ONLY', label: 'Permit only', hint: 'Resident permit holders' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'Clearway', hint: 'No stopping during set hours' },
  { type: 'LOADING_ZONE', label: 'Loading zone', hint: 'Reserved for loading vehicles' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Accessible / ACROD permit', hint: 'Reserved for disability parking permit holders' },
]

const INDIA_SIGN_OPTIONS: SignOption[] = [
  { type: 'INFORMAL_TOLERATED', label: 'Informally okay', hint: 'No sign or rule, but people park here without issue' },
  { type: 'PAID_METER', label: 'Pay & Park zone', hint: 'Municipal or contractor-run paid zone, attendant collects cash' },
  { type: 'PERMIT_ONLY', label: 'Society / RWA reserved', hint: 'Reserved for residents of a society or building' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'No parking (enforced)', hint: 'Towing/fines actually happen here, e.g. main roads, near police posts' },
  { type: 'FREE_UNLIMITED', label: 'Open, no restriction', hint: 'Genuinely free and unrestricted' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Disability reserved', hint: 'Marked for accessible parking' },
]

const UNITED_STATES_SIGN_OPTIONS: SignOption[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, unrestricted', hint: 'No sign, no time limit' },
  { type: 'TIME_LIMITED', label: 'Time limited', hint: 'e.g. "2 hour parking 8am-6pm"' },
  { type: 'PAID_METER', label: 'Metered', hint: 'Parking meter or pay station' },
  { type: 'PERMIT_ONLY', label: 'Residential permit zone', hint: 'Permit required, e.g. "Zone 4 permit only"' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'Street cleaning / no parking', hint: 'e.g. "No parking Tue 8-10am, street cleaning"' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Disabled / handicap permit', hint: 'Reserved for a valid disability placard or plate' },
]

const UNITED_KINGDOM_SIGN_OPTIONS: SignOption[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, unrestricted', hint: 'No lines, no signage' },
  { type: 'TIME_LIMITED', label: 'Time limited', hint: 'e.g. "1 hour, no return within 2 hours"' },
  { type: 'PAID_METER', label: 'Pay & Display', hint: 'Ticket machine or pay-by-phone bay' },
  { type: 'PERMIT_ONLY', label: "Residents' bay", hint: 'Permit holders only' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'Yellow lines', hint: 'Single or double yellow line restrictions' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Blue Badge holders only', hint: 'Reserved for Blue Badge disabled parking permit holders' },
]

const PRESETS_BY_COUNTRY: Record<string, SignOption[]> = {
  australia: AUSTRALIA_SIGN_OPTIONS,
  india: INDIA_SIGN_OPTIONS,
  'united states': UNITED_STATES_SIGN_OPTIONS,
  'united states of america': UNITED_STATES_SIGN_OPTIONS,
  'united kingdom': UNITED_KINGDOM_SIGN_OPTIONS,
}

/** Falls back to a generic, honest set for any country without a bespoke vocabulary yet. */
export function getSignOptionsForCountry(country: string | null | undefined): SignOption[] {
  if (!country) return GENERIC_SIGN_OPTIONS
  return PRESETS_BY_COUNTRY[country.trim().toLowerCase()] ?? GENERIC_SIGN_OPTIONS
}

export function hasLocalPreset(country: string | null | undefined): boolean {
  if (!country) return false
  return country.trim().toLowerCase() in PRESETS_BY_COUNTRY
}

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  australia: 'AUD',
  india: 'INR',
  'united states': 'USD',
  'united states of america': 'USD',
  'united kingdom': 'GBP',
}

/** Best-effort default currency for a paid sign, based on the reporting country. */
export function getDefaultCurrency(country: string | null | undefined): string {
  if (!country) return 'USD'
  return CURRENCY_BY_COUNTRY[country.trim().toLowerCase()] ?? 'USD'
}
