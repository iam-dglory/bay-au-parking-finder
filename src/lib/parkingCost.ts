/**
 * "I'll be N minutes — what will it cost and when must I leave?"
 *
 * Street bays use the council's Pay Stay schedule (per weekday time windows
 * with an hourly price and a maximum stay). Car parks use published operator
 * rate tables (casual tiers, a daily maximum and flat rates such as early bird).
 * All times are Melbourne wall-clock minutes; a stay is at most 24 hours.
 */

/** [fromMinute, toMinute, centsPerHour, maxStayMinutes] */
export type RateWindow = [number, number, number, number]
/** Index 0 = Sunday … 6 = Saturday */
export type WeekSchedule = RateWindow[][]

export interface LocalStart {
  /** 0 = Sunday … 6 = Saturday */
  day: number
  /** minutes after local midnight */
  minute: number
}

const MELBOURNE_TZ = 'Australia/Melbourne'
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function melbourneStart(date: Date): LocalStart {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: MELBOURNE_TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)!.value
  return { day: DAY_INDEX[get('weekday')], minute: Number(get('hour')) * 60 + Number(get('minute')) }
}

export interface StreetCost {
  cents: number
  /** Minutes after arrival when the time limit runs out, if it does during the stay. */
  limitAfterMinutes: number | null
  /** Longest stay allowed from this arrival (null = no limit applies within 24 h). */
  maxStayMinutes: number | null
  /** Paid segments, for "until 6:30pm $5.50/hr, then free". */
  segments: { fromMinute: number; toMinute: number; centsPerHour: number }[]
}

function windowAt(schedule: WeekSchedule, absMinute: number): RateWindow | null {
  const day = Math.floor(absMinute / 1440) % 7
  const minute = absMinute % 1440
  return schedule[day]?.find(w => minute >= w[0] && minute < w[1]) ?? null
}

/** Cost of a street stay. Time limits count from arrival, or from when the
 * restriction starts if you arrive before it. A limit ends with its window. */
export function streetCost(schedule: WeekSchedule, start: LocalStart, durationMinutes: number): StreetCost {
  const startAbs = start.day * 1440 + start.minute
  const horizon = Math.max(durationMinutes, 24 * 60)
  let cents = 0
  let limitAfter: number | null = null
  const segments: StreetCost['segments'] = []
  let windowStartedAt: number | null = null
  let current: RateWindow | null = null
  for (let offset = 0; offset < horizon; offset++) {
    const w = windowAt(schedule, startAbs + offset)
    if (w !== current) { current = w; windowStartedAt = w ? offset : null }
    if (w && w[3] > 0 && windowStartedAt != null && offset - windowStartedAt >= w[3] && limitAfter == null) limitAfter = offset
    if (offset >= durationMinutes) { if (limitAfter != null) break; continue }
    if (!w || w[2] <= 0) continue
    cents += w[2] / 60
    const last = segments[segments.length - 1]
    if (last && last.toMinute === offset && last.centsPerHour === w[2]) last.toMinute = offset + 1
    else segments.push({ fromMinute: offset, toMinute: offset + 1, centsPerHour: w[2] })
  }
  return {
    cents: Math.round(cents),
    limitAfterMinutes: limitAfter != null && limitAfter < durationMinutes ? limitAfter : null,
    maxStayMinutes: limitAfter,
    segments,
  }
}

/** Range over several possible schedules (when a street has more than one pay zone). */
export function streetCostRange(schedules: WeekSchedule[], start: LocalStart, durationMinutes: number) {
  const results = schedules.map(s => streetCost(s, start, durationMinutes))
  const cents = results.map(r => r.cents)
  const stays = results.map(r => r.maxStayMinutes ?? Infinity)
  const shortest = Math.min(...stays)
  return {
    minCents: Math.min(...cents),
    maxCents: Math.max(...cents),
    /** The strictest limit among the possible zones, so the advice is never too generous. */
    maxStayMinutes: Number.isFinite(shortest) ? shortest : null,
    exact: results.length === 1,
    results,
  }
}

/* ------------------------------------------------------------------ */
/* Car parks                                                           */
/* ------------------------------------------------------------------ */

export interface CasualTier { upToMinutes: number; cents: number }
export interface FlatRate {
  name: string
  /** 0 = Sunday … 6 = Saturday; the entry day. */
  days: number[]
  enterFrom: number
  enterTo: number
  /** Must leave after this minute (same day), e.g. early bird after 3pm. */
  exitAfter?: number
  /** Must leave by this minute; if <= enterFrom it is the next morning. */
  exitBy?: number
  cents: number
}
export interface CarParkRates {
  casual: CasualTier[]
  /** Entry days the casual tiers apply to (default: every day). */
  casualDays?: number[]
  /** Entry window for casual tiers, e.g. 6am–4pm (default: any time). */
  casualEnterFrom?: number
  casualEnterTo?: number
  /** Price for any stay longer than the last tier, up to 24 h. */
  dailyMaxCents?: number
  flat?: FlatRate[]
}
export interface CarParkCost { cents: number; rateName: string }

/** Cheapest published way to pay for this stay. */
export function carParkCost(rates: CarParkRates, start: LocalStart, durationMinutes: number): CarParkCost | null {
  const options: CarParkCost[] = []
  const casualApplies = (rates.casualDays ?? [0, 1, 2, 3, 4, 5, 6]).includes(start.day)
    && start.minute >= (rates.casualEnterFrom ?? 0) && start.minute <= (rates.casualEnterTo ?? 1439)
  if (casualApplies) {
    const tier = rates.casual.find(t => durationMinutes <= t.upToMinutes)
    if (tier) options.push({ cents: rates.dailyMaxCents != null ? Math.min(tier.cents, rates.dailyMaxCents) : tier.cents, rateName: 'Hourly' })
    else if (rates.dailyMaxCents != null && durationMinutes <= 24 * 60) options.push({ cents: rates.dailyMaxCents, rateName: 'Day rate' })
  }
  const exit = start.minute + durationMinutes
  for (const flat of rates.flat ?? []) {
    if (!flat.days.includes(start.day) || start.minute < flat.enterFrom || start.minute > flat.enterTo) continue
    if (flat.exitAfter != null && exit < flat.exitAfter) continue
    if (flat.exitBy != null) {
      const exitLimit = flat.exitBy <= flat.enterFrom ? flat.exitBy + 1440 : flat.exitBy
      if (exit > exitLimit) continue
    }
    options.push({ cents: flat.cents, rateName: flat.name })
  }
  if (!options.length) return null
  return options.reduce((best, o) => (o.cents < best.cents ? o : best))
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

export function formatDurationShort(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60), m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
