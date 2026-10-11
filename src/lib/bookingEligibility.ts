import type { CarPark } from '../types'

/**
 * This registry is intentionally empty until Bay has a verified operator
 * agreement and an official reservation URL or API. A mapped car park, price
 * or general website is never enough evidence to offer a booking.
 */
export type VerifiedBookingProvider = {
  areaId: string
  operatorName: string
  bookingUrl: string
  providerLocationId: string
  currency: 'AUD' | 'INR' | 'USD'
  lastVerifiedAt: string
  bookingMethod: 'external'
}

export const VERIFIED_BOOKING_PROVIDERS: readonly VerifiedBookingProvider[] = []

export function verifiedExternalBooking(area: CarPark): VerifiedBookingProvider | null {
  const provider = VERIFIED_BOOKING_PROVIDERS.find(candidate => candidate.areaId === area.id) ?? null
  if (!provider) return null
  try {
    const url = new URL(provider.bookingUrl)
    if (url.protocol !== 'https:' || !provider.operatorName.trim() || !provider.providerLocationId.trim()) return null
  } catch {
    return null
  }
  return provider
}

export function bookableAreas(areas: CarPark[]) {
  return areas.flatMap(area => {
    // Bookings must always be for a verified off-street parking area.
    if (area.kind !== 'area' || area.mapped_zone) return []
    const provider = verifiedExternalBooking(area)
    return provider ? [{ area, provider }] : []
  })
}

/** Timestamps are compared in UTC. A future provider integration must ask its
 * server for the provider-local slots, then validate the returned instant with
 * this same 24-hour ceiling before presenting a booking action. */
export function isWithinBookingWindow(startsAt: Date, serverNow: Date) {
  const start = startsAt.getTime()
  const now = serverNow.getTime()
  return Number.isFinite(start) && start >= now && start <= now + 24 * 60 * 60 * 1000
}
