import type { SignType } from '../types'

export interface SignOption {
  type: SignType
  label: string
  hint: string
}

/** Sign types as they appear on Melbourne (Victorian) parking plates. */
export const SIGN_OPTIONS: SignOption[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, no limit', hint: 'Plain "P" sign, no restrictions' },
  { type: 'TIME_LIMITED', label: 'Free, time limited', hint: 'e.g. 1P, 2P, 4P signs' },
  { type: 'PAID_METER', label: 'Paid / ticket', hint: 'Meter or pay-by-app parking' },
  { type: 'PERMIT_ONLY', label: 'Permit only', hint: 'Resident permit holders' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'Clearway', hint: 'No stopping during set hours' },
  { type: 'LOADING_ZONE', label: 'Loading zone', hint: 'Reserved for loading vehicles' },
  { type: 'ACCESSIBLE_PERMIT', label: 'Accessible permit', hint: 'Reserved for disability parking permit holders' },
]

export const CURRENCY = 'AUD'
