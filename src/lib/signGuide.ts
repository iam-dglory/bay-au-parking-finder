import type { SignType } from '../types'

/** Whether a driver can generally park there at all, collapsed to just two
 * states for the guide page on purpose. It's a quick "can I park here?"
 * reference, not the full time, day and price detail the live map shows.
 * Paid parking counts as usable since you can still park, it just costs
 * money. Permit, loading, clearway and accessible-only signs count as
 * restricted since an ordinary driver generally can't use them. */
export const SIGN_AVAILABILITY: Record<SignType, 'usable' | 'restricted'> = {
  FREE_UNLIMITED: 'usable',
  TIME_LIMITED: 'usable',
  PAID_METER: 'usable',
  INFORMAL_TOLERATED: 'usable',
  PERMIT_ONLY: 'restricted',
  NO_STOPPING_CLEARWAY: 'restricted',
  LOADING_ZONE: 'restricted',
  ACCESSIBLE_PERMIT: 'restricted',
}

export const GUIDE_COUNTRIES = ['Australia', 'India', 'United States', 'United Kingdom'] as const

export const COUNTRY_GUIDE_INTRO: Record<(typeof GUIDE_COUNTRIES)[number], string> = {
  Australia:
    'A number like "2P" means free parking for 2 hours, shown with the days and hours it applies, e.g. "8:30AM-6PM MON-FRI". One pole can show more than one rule for different days, like "2P" on weekdays and "1P" on Saturday. Outside those hours, it is usually free.',
  India: 'Street parking mostly has no official sign. It runs on local custom, paid attendants, or building reservations.',
  'United States': 'Signs show the time limit and hours directly, like "2 HR PARKING 8AM to 6PM".',
  'United Kingdom': 'Rules are shown with road paint. Yellow lines mean restricted parking. Blue Badge parking has its own rules.',
}

export const GUIDE_GENERIC_INTRO = 'No tailored guide yet for this country. Reporting still works with a simple set of categories.'

/** One-line, plain-language meaning per sign type, kept separate from the
 * longer per-country hint text so the guide can stay short. */
export const SIGN_TYPE_MEANING: Record<SignType, string> = {
  FREE_UNLIMITED: 'Park here any time, no limit.',
  TIME_LIMITED: 'Free, but only for a set number of hours.',
  PAID_METER: 'Pay to park, by meter or app.',
  PERMIT_ONLY: 'Only permit holders can park here.',
  NO_STOPPING_CLEARWAY: 'No stopping, at all times or set hours.',
  LOADING_ZONE: 'Only for vehicles loading or unloading.',
  INFORMAL_TOLERATED: 'No official rule, but commonly used.',
  ACCESSIBLE_PERMIT: 'Only for accessible parking permit holders.',
}
