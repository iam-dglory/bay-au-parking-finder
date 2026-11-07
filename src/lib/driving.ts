import { haversineMeters } from './distance'

/** A GPS fix as the watcher reports it. `speed` is metres per second when the
 * device provides it (most phones do while moving); otherwise it is derived
 * from consecutive fixes. */
export interface Fix { lat: number; lng: number; time: number; speed?: number | null; accuracy?: number }

export interface DrivingState { moving: boolean; fastSince: number | null; slowSince: number | null; last: Fix | null }

export const INITIAL_DRIVING: DrivingState = { moving: false, fastSince: null, slowSince: null, last: null }

/** 15 km/h: faster than walking or cycling in the CBD. */
const FAST = 15 / 3.6
/** Below 5 km/h counts as stopped. */
const SLOW = 5 / 3.6
/** Seconds above FAST before we call it driving (ignores GPS jumps). */
const START_AFTER = 8_000
/** Seconds stopped before we stop calling it driving. Long enough to ride out
 * most traffic lights, which still count as driving under road rules. */
const STOP_AFTER = 45_000

function speedOf(fix: Fix, last: Fix | null): number | null {
  if (fix.speed != null && Number.isFinite(fix.speed) && fix.speed >= 0) return fix.speed
  if (!last) return null
  const dt = (fix.time - last.time) / 1000
  if (dt < 2 || (fix.accuracy ?? 0) > 50) return null
  return haversineMeters(last, fix) / dt
}

export function nextDrivingState(state: DrivingState, fix: Fix): DrivingState {
  const speed = speedOf(fix, state.last)
  if (speed == null) return { ...state, last: fix }
  if (speed >= FAST) {
    const fastSince = state.fastSince ?? fix.time
    return { moving: state.moving || fix.time - fastSince >= START_AFTER, fastSince, slowSince: null, last: fix }
  }
  if (speed < SLOW) {
    const slowSince = state.slowSince ?? fix.time
    return { moving: state.moving && fix.time - slowSince < STOP_AFTER, fastSince: null, slowSince, last: fix }
  }
  // Rolling slowly: keep whatever we were doing.
  return { ...state, fastSince: state.moving ? state.fastSince : null, slowSince: null, last: fix }
}
