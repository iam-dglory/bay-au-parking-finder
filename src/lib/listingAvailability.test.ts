import { describe, it, expect } from 'vitest'
import { isWithinDeclaredHours, computeBookingTotal, formatMoney, computeBookingPricing } from './listingAvailability'
import type { Listing } from '../types'

function listing(overrides: Partial<Listing>): Listing {
  return {
    id: 'l1',
    address_text: 'Test Driveway',
    country: 'Australia',
    currency: 'AUD',
    price_per_hour: 5,
    description: null,
    days_active: [1, 2, 3, 4, 5],
    time_from: '18:00',
    time_to: '23:00',
    lat: 0,
    lng: 0,
    distance_m: 0,
    owner_id: 'owner1',
    ...overrides,
  }
}

// 2026-08-07 is a Friday
function dateAt(hh: number, mm: number) {
  return new Date(2026, 7, 7, hh, mm, 0)
}

describe('isWithinDeclaredHours', () => {
  it('is true inside the declared window on an active day', () => {
    expect(isWithinDeclaredHours(listing({}), dateAt(19, 0))).toBe(true)
  })

  it('is false outside the declared window', () => {
    expect(isWithinDeclaredHours(listing({}), dateAt(10, 0))).toBe(false)
  })

  it('is false on a day not in days_active', () => {
    expect(isWithinDeclaredHours(listing({ days_active: [0, 6] }), dateAt(19, 0))).toBe(false)
  })

  it('is true whenever no hours are declared (always available)', () => {
    expect(isWithinDeclaredHours(listing({ time_from: null, time_to: null }), dateAt(3, 0))).toBe(true)
  })
})

describe('computeBookingTotal', () => {
  it('multiplies price by duration and rounds to cents', () => {
    expect(computeBookingTotal(5.5, 2)).toBe(11)
    expect(computeBookingTotal(3.333, 1.5)).toBe(5)
  })
})

describe('computeBookingPricing', () => {
  const now = dateAt(10, 0)

  it('charges no reservation fee for a same-day booking', () => {
    const startsAt = new Date(now.getTime() + 2 * 3600_000) // 2h ahead
    const pricing = computeBookingPricing(10, 2, startsAt, now)
    expect(pricing.isAdvance).toBe(false)
    expect(pricing.reservationFee).toBe(0)
    expect(pricing.total).toBe(pricing.base)
  })

  it('charges a 20% reservation fee for a booking >=24h ahead', () => {
    const startsAt = new Date(now.getTime() + 25 * 3600_000) // 25h ahead
    const pricing = computeBookingPricing(10, 2, startsAt, now) // base = 20
    expect(pricing.isAdvance).toBe(true)
    expect(pricing.reservationFee).toBe(4)
    expect(pricing.total).toBe(24)
  })

  it('treats exactly 24h ahead as an advance booking', () => {
    const startsAt = new Date(now.getTime() + 24 * 3600_000)
    const pricing = computeBookingPricing(10, 1, startsAt, now)
    expect(pricing.isAdvance).toBe(true)
  })

  it('treats 23h59m ahead as not advance', () => {
    const startsAt = new Date(now.getTime() + 24 * 3600_000 - 60_000)
    const pricing = computeBookingPricing(10, 1, startsAt, now)
    expect(pricing.isAdvance).toBe(false)
  })
})

describe('formatMoney', () => {
  it('formats known currencies with their symbol', () => {
    expect(formatMoney('INR', 150)).toBe('₹150.00')
    expect(formatMoney('USD', 12)).toBe('$12.00')
  })

  it('falls back to the currency code for unknown currencies', () => {
    expect(formatMoney('XYZ', 10)).toBe('XYZ 10.00')
  })
})
