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

/** The one thing most drivers get wrong, in one line. */
export const GUIDE_INTRO = '2P means 2 hours. It’s only free if there’s no meter or ticket sign.'

/** One-line, plain-language meaning per sign type, kept separate from the
 * longer per-country hint text so the guide can stay short. */
export const SIGN_TYPE_MEANING: Record<SignType, string> = {
  FREE_UNLIMITED: 'Park here any time, no limit.',
  TIME_LIMITED: 'Free for the hours shown, e.g. 1P = 1 hour.',
  PAID_METER: 'Pay at the meter or by app.',
  PERMIT_ONLY: 'Only permit holders can park here.',
  NO_STOPPING_CLEARWAY: 'No stopping, at all times or set hours.',
  LOADING_ZONE: 'Only for vehicles loading or unloading.',
  INFORMAL_TOLERATED: 'No official rule, but commonly used.',
  ACCESSIBLE_PERMIT: 'Only for accessible parking permit holders.',
}
