import tzLookup from 'tz-lookup'
import type { ParkingRule, ParkingSpot, SpotStatus } from '../types'
import { formatMoney } from './money'
import { formatMaxStay } from './formatDuration'

function toMinutes(time: string | null): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

/** The spot's own IANA timezone, from its coordinates — not the viewer's
 * device. Someone checking parking in Sydney from Perth (or from the other
 * side of the world via city/destination search) must be evaluated against
 * Sydney's clock, not their own, or a sign that's active there right now
 * could show as free (or vice versa). Falls back to `undefined` for
 * coordinates tz-lookup can't resolve (e.g. open ocean), in which case
 * callers fall back to the device's local time as a last resort. */
function timeZoneAt(lat: number, lng: number): string | undefined {
  try {
    return tzLookup(lat, lng)
  } catch {
    return undefined
  }
}

interface LocalNow {
  day: number
  minutes: number
}

/** `now`'s wall-clock day-of-week and minutes-since-midnight, as seen at the
 * given timezone (or the device's own, if the timezone couldn't be resolved). */
function localNow(now: Date, timeZone: string | undefined): LocalNow {
  if (!timeZone) return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() }
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(
    now,
  )
  const weekday = parts.find((p) => p.type === 'weekday')!.value
  const hour = Number(parts.find((p) => p.type === 'hour')!.value)
  const minute = Number(parts.find((p) => p.type === 'minute')!.value)
  return { day: WEEKDAY_INDEX[weekday], minutes: hour * 60 + minute }
}

function formatTime(date: Date, timeZone: string | undefined): string {
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone })
}

/** Whether `local` falls inside the rule's active window, handling windows
 * that wrap past midnight (e.g. clearway 10pm-6am). */
function isInWindow(rule: ParkingRule, local: LocalNow): boolean {
  if (!rule.days_active.includes(local.day)) {
    // A wrap-past-midnight window can still be "active" today if it started
    // yesterday and yesterday is a listed day.
    const from = toMinutes(rule.time_from)
    const to = toMinutes(rule.time_to)
    if (from > to) {
      const yesterday = (local.day + 6) % 7
      if (rule.days_active.includes(yesterday) && local.minutes < to) return true
    }
    return false
  }
  if (!rule.time_from || !rule.time_to) return true
  const from = toMinutes(rule.time_from)
  const to = toMinutes(rule.time_to)
  if (from === to) return true // 00:00-23:59 style "all day" window
  if (from < to) return local.minutes >= from && local.minutes < to
  // wraps past midnight
  return local.minutes >= from || local.minutes < to
}

/** Minutes from now (at the spot's local time) until the rule's window next starts. */
function minutesUntilWindowStart(rule: ParkingRule, local: LocalNow): number {
  const from = toMinutes(rule.time_from)
  for (let offset = 0; offset < 8; offset++) {
    const day = (local.day + offset) % 7
    if (!rule.days_active.includes(day)) continue
    const candidate = offset * 1440 + from
    if (candidate > local.minutes) return candidate - local.minutes
  }
  return 7 * 1440
}

/** Minutes from now (at the spot's local time) until a currently-active window ends. */
function minutesUntilWindowEnd(rule: ParkingRule, local: LocalNow): number {
  const from = toMinutes(rule.time_from)
  const to = toMinutes(rule.time_to)
  if (from > to && local.minutes >= from) {
    // window started today and crosses midnight — it ends tomorrow
    return 1440 + to - local.minutes
  }
  return to - local.minutes
}

const RESTRICTIVENESS: Record<SpotStatus['status'], number> = { restricted: 0, paid: 1, free: 2 }

function evaluateRule(rule: ParkingRule, local: LocalNow, now: Date, timeZone: string | undefined): SpotStatus {
  const inWindow = isInWindow(rule, local)

  if (!inWindow) {
    const changesAt = rule.time_from ? new Date(now.getTime() + minutesUntilWindowStart(rule, local) * 60_000) : null
    return {
      status: 'free',
      label: 'Free right now',
      detail: rule.notes ?? 'Outside signed restriction hours',
      price_per_hour: null,
      changesAt,
      ruleApplied: rule,
      timeZone,
    }
  }

  const changesAt = new Date(now.getTime() + minutesUntilWindowEnd(rule, local) * 60_000)

  switch (rule.sign_type) {
    case 'PAID_METER': {
      const priceTxt = rule.price_per_hour != null ? `Paid, ${formatMoney(rule.currency ?? 'USD', rule.price_per_hour)}/hr` : 'Paid parking'
      const maxStayTxt = rule.max_stay_minutes ? ` · max ${formatMaxStay(rule.max_stay_minutes)}` : ''
      return {
        status: 'paid',
        label: `${priceTxt}${maxStayTxt}`,
        detail: rule.notes ?? 'Ticket / meter parking',
        price_per_hour: rule.price_per_hour,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    }
    case 'ACCESSIBLE_PERMIT':
      return {
        status: 'restricted',
        label: 'Accessible permit only',
        detail: rule.notes ?? 'Reserved for disability/accessible parking permit holders',
        price_per_hour: null,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    case 'PERMIT_ONLY':
      return {
        status: 'restricted',
        label: 'Permit holders only',
        detail: rule.notes ?? 'Resident permit required',
        price_per_hour: null,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    case 'NO_STOPPING_CLEARWAY':
      return {
        status: 'restricted',
        label: 'No stopping (clearway)',
        detail: rule.notes ?? 'Clearway in effect, vehicles will be towed',
        price_per_hour: null,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    case 'LOADING_ZONE':
      return {
        status: 'restricted',
        label: 'Loading zone only',
        detail: rule.notes ?? 'Reserved for loading vehicles',
        price_per_hour: null,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    case 'TIME_LIMITED': {
      return {
        status: 'free',
        label: rule.max_stay_minutes ? `Free, max stay ${formatMaxStay(rule.max_stay_minutes)}` : 'Free, time limited',
        detail: rule.notes ?? 'Time-limited free parking',
        price_per_hour: null,
        changesAt,
        ruleApplied: rule,
        timeZone,
      }
    }
    case 'INFORMAL_TOLERATED':
      return {
        status: 'free',
        label: 'Informally okay',
        detail: rule.notes ?? 'No official rule. Reported as commonly tolerated here, not guaranteed.',
        price_per_hour: null,
        changesAt: null,
        ruleApplied: rule,
        timeZone,
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
        timeZone,
      }
  }
}

export function evaluateSpotStatus(rules: ParkingRule[], lat: number, lng: number, now: Date = new Date()): SpotStatus {
  const timeZone = timeZoneAt(lat, lng)
  const local = localNow(now, timeZone)

  if (rules.length === 0) {
    return {
      status: 'free',
      label: 'Unknown restrictions',
      detail: 'No sign data recorded for this spot yet',
      price_per_hour: null,
      changesAt: null,
      ruleApplied: null,
      timeZone,
    }
  }

  const evaluated = rules.map((r) => evaluateRule(r, local, now, timeZone))
  const active = evaluated.filter((s) => s.ruleApplied && isInWindow(s.ruleApplied, local))

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
  return `until ${formatTime(status.changesAt, status.timeZone)}`
}

/** Best-option-first ranking: usable now > free-before-paid > cheaper > closer > longer remaining. */
export function rankSpots(spots: ParkingSpot[], now: Date = new Date()): (ParkingSpot & { status: SpotStatus })[] {
  return spots
    .map((spot) => ({ ...spot, status: evaluateSpotStatus(spot.rules, spot.lat, spot.lng, now) }))
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
