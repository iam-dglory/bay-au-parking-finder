import type { Listing } from '../types'
import { CURRENCY_OPTIONS } from '../types'

function toMinutes(time: string | null): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Soft check only — does NOT prevent booking, just warns. The real guarantee
 * against double-booking is the DB exclusion constraint on `bookings`. */
export function isWithinDeclaredHours(listing: Listing, start: Date): boolean {
  if (!listing.time_from || !listing.time_to) return true
  const day = start.getDay()
  if (!listing.days_active.includes(day)) return false
  const minutes = start.getHours() * 60 + start.getMinutes()
  const from = toMinutes(listing.time_from)
  const to = toMinutes(listing.time_to)
  if (from === to) return true
  if (from < to) return minutes >= from && minutes < to
  return minutes >= from || minutes < to
}

export function computeBookingTotal(pricePerHour: number, durationHours: number): number {
  return Math.round(pricePerHour * durationHours * 100) / 100
}

export function formatMoney(currency: string, amount: number): string {
  const symbol = CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? currency + ' '
  return `${symbol}${amount.toFixed(2)}`
}
