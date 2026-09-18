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

export const ADVANCE_BOOKING_HOURS = 24
export const ADVANCE_BOOKING_FEE_RATE = 0.2

export interface BookingPricing {
  base: number
  reservationFee: number
  total: number
  isAdvance: boolean
}

/** Booking ≥24h ahead reserves/guarantees the spot for you, which carries a
 * 20% "lock it in" premium over booking last-minute. */
export function computeBookingPricing(pricePerHour: number, durationHours: number, startsAt: Date, now: Date = new Date()): BookingPricing {
  const base = computeBookingTotal(pricePerHour, durationHours)
  const hoursAhead = (startsAt.getTime() - now.getTime()) / 3600_000
  const isAdvance = hoursAhead >= ADVANCE_BOOKING_HOURS
  const reservationFee = isAdvance ? Math.round(base * ADVANCE_BOOKING_FEE_RATE * 100) / 100 : 0
  return { base, reservationFee, total: Math.round((base + reservationFee) * 100) / 100, isAdvance }
}

export function formatMoney(currency: string, amount: number): string {
  const symbol = CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? currency + ' '
  return `${symbol}${amount.toFixed(2)}`
}
