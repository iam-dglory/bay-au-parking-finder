import { describe, expect, it } from 'vitest'
import { bookableAreas, isWithinBookingWindow, verifiedExternalBooking } from './bookingEligibility'
import type { CarPark } from '../types'

const area = (overrides: Partial<CarPark> = {}): CarPark => ({
  id: 'area-1', address_text: 'Verified car park', suburb: null, lat: -37.81, lng: 144.96,
  distance_m: 0, capacity: 10, census_year: 2024, kind: 'area', ...overrides,
})

describe('booking eligibility', () => {
  it('does not treat a mapped parking area as bookable without a verified provider', () => {
    expect(verifiedExternalBooking(area())).toBeNull()
    expect(bookableAreas([area()])).toEqual([])
  })

  it('never permits mapped roadside zones or individual bays', () => {
    expect(bookableAreas([area({ mapped_zone: true }), area({ kind: 'bay' })])).toEqual([])
  })

  it('only permits starts from server-now through the next 24 hours', () => {
    const now = new Date('2026-10-11T08:00:00.000Z')
    expect(isWithinBookingWindow(new Date('2026-10-11T08:00:00.000Z'), now)).toBe(true)
    expect(isWithinBookingWindow(new Date('2026-10-12T08:00:00.000Z'), now)).toBe(true)
    expect(isWithinBookingWindow(new Date('2026-10-11T07:59:59.999Z'), now)).toBe(false)
    expect(isWithinBookingWindow(new Date('2026-10-12T08:00:00.001Z'), now)).toBe(false)
  })
})
