import type { ParkingRule, ParkingSpot, SpotStatus } from '../types'

function toMinutes(time: string | null): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

/** Whether `nowMinutes` on `nowDay` falls inside the rule's active window, handling
 * windows that wrap past midnight (e.g. clearway 10pm-6am). */
function isInWindow(rule: ParkingRule, nowDay: number, nowMinutes: number): boolean {
  if (!rule.days_active.includes(nowDay)) {
    // A wrap-past-midnight window can still be "active" today if it started
    // yesterday and yesterday is a listed day.
    const from = toMinutes(rule.time_from)
    const to = toMinutes(rule.time_to)
    if (from > to) {
      const yesterday = (nowDay + 6) % 7
      if (rule.days_active.includes(yesterday) && nowMinutes < to) return true
    }
    return false
  }
  if (!rule.time_from || !rule.time_to) return true
  const from = toMinutes(rule.time_from)
  const to = toMinutes(rule.time_to)
  if (from === to) return true // 00:00-23:59 style "all day" window
  if (from < to) return nowMinutes >= from && nowMinutes < to
  // wraps past midnight
  return nowMinutes >= from || nowMinutes < to
}

/** Next Date (today or later) at which the rule's window starts. */
function nextWindowStart(rule: ParkingRule, now: Date): Date {
  const from = toMinutes(rule.time_from)
  for (let offset = 0; offset < 8; offset++) {
    const day = (now.getDay() + offset) % 7
    if (!rule.days_active.includes(day)) continue
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    candidate.setHours(Math.floor(from / 60), from % 60, 0, 0)
    if (candidate > now) return candidate
  }
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
}

/** Today's window-end Date for a rule currently in its active window. */
function windowEndToday(rule: ParkingRule, now: Date): Date {
  const to = toMinutes(rule.time_to)
  const from = toMinutes(rule.time_from)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const inTailFromYesterday = from > to && nowMinutes < to
  const end = new Date(now)
  if (from > to && !inTailFromYesterday) {
    // window started today and crosses midnight — it ends tomorrow
    end.setDate(end.getDate() + 1)
  }
  end.setHours(Math.floor(to / 60), to % 60, 0, 0)
  return end
}

const RESTRICTIVENESS: Record<SpotStatus['status'], number> = { restricted: 0, paid: 1, free: 2 }

function evaluateRule(rule: ParkingRule, now: Date): SpotStatus {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const inWindow = isInWindow(rule, now.getDay(), nowMinutes)

  if (!inWindow) {
    const changesAt = rule.time_from ? nextWindowStart(rule, now) : null
    return {
      status: 'free',
      label: 'Free right now',
      detail: rule.notes ?? 'Outside signed restriction hours',
      price_per_hour: null,
      changesAt,
      ruleApplied: rule,
    }
  }

  switch (rule.sign_type) {
    case 'PAID_METER':
      return {
        status: 'paid',
        label: `Paid — $${rule.price_per_hour?.toFixed(2) ?? '?'}/hr`,
        detail: rule.notes ?? 'Ticket / meter parking',
        price_per_hour: rule.price_per_hour,
        changesAt: windowEndToday(rule, now),
        ruleApplied: rule,
      }
    case 'PERMIT_ONLY':
      return {
        status: 'restricted',
        label: 'Permit holders only',
        detail: rule.notes ?? 'Resident permit required',
        price_per_hour: null,
        changesAt: windowEndToday(rule, now),
        ruleApplied: rule,
      }
    case 'NO_STOPPING_CLEARWAY':
      return {
        status: 'restricted',
        label: 'No stopping (clearway)',
        detail: rule.notes ?? 'Clearway in effect, vehicles will be towed',
        price_per_hour: null,
        changesAt: windowEndToday(rule, now),
        ruleApplied: rule,
      }
    case 'LOADING_ZONE':
      return {
        status: 'restricted',
        label: 'Loading zone only',
        detail: rule.notes ?? 'Reserved for loading vehicles',
        price_per_hour: null,
        changesAt: windowEndToday(rule, now),
        ruleApplied: rule,
      }
    case 'TIME_LIMITED': {
      const hrs = rule.max_stay_minutes ? rule.max_stay_minutes / 60 : null
      return {
        status: 'free',
        label: hrs ? `Free, max stay ${hrs}h` : 'Free, time limited',
        detail: rule.notes ?? 'Time-limited free parking',
        price_per_hour: null,
        changesAt: windowEndToday(rule, now),
        ruleApplied: rule,
      }
    }
    case 'FREE_UNLIMITED':
    default:
      return {
        status: 'free',
        label: 'Free, no time limit',
        detail: rule.notes ?? 'Unrestricted free parking',
        price_per_hour: null,
        changesAt: null,
        ruleApplied: rule,
      }
  }
}

export function evaluateSpotStatus(rules: ParkingRule[], now: Date = new Date()): SpotStatus {
  if (rules.length === 0) {
    return {
      status: 'free',
      label: 'Unknown restrictions',
      detail: 'No sign data recorded for this spot yet',
      price_per_hour: null,
      changesAt: null,
      ruleApplied: null,
    }
  }

  const evaluated = rules.map((r) => evaluateRule(r, now))
  const active = evaluated.filter((s) => s.ruleApplied && isInWindow(s.ruleApplied, now.getDay(), now.getHours() * 60 + now.getMinutes()))

  if (active.length === 0) {
    // nothing currently restricting — free, report the soonest upcoming change
    const soonest = evaluated
      .filter((s) => s.changesAt)
      .sort((a, b) => a.changesAt!.getTime() - b.changesAt!.getTime())[0]
    return soonest ?? evaluated[0]
  }

  return active.sort((a, b) => RESTRICTIVENESS[a.status] - RESTRICTIVENESS[b.status])[0]
}

export function formatChangesAt(status: SpotStatus): string | null {
  if (!status.changesAt) return null
  return `until ${formatTime(status.changesAt)}`
}

/** Best-option-first ranking: usable now > free-before-paid > cheaper > closer > longer remaining. */
export function rankSpots(spots: ParkingSpot[], now: Date = new Date()): (ParkingSpot & { status: SpotStatus })[] {
  return spots
    .map((spot) => ({ ...spot, status: evaluateSpotStatus(spot.rules, now) }))
    .sort((a, b) => {
      const byRestrictiveness = RESTRICTIVENESS[a.status.status] - RESTRICTIVENESS[b.status.status]
      if (byRestrictiveness !== 0) return -byRestrictiveness // free/paid before restricted
      if (a.status.status === 'paid' && b.status.status === 'paid') {
        const priceDiff = (a.status.price_per_hour ?? 0) - (b.status.price_per_hour ?? 0)
        if (priceDiff !== 0) return priceDiff
      }
      const distDiff = a.distance_m - b.distance_m
      if (distDiff !== 0) return distDiff
      const aRemaining = a.status.changesAt?.getTime() ?? Infinity
      const bRemaining = b.status.changesAt?.getTime() ?? Infinity
      return bRemaining - aRemaining
    })
}
