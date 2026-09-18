import { describe, it, expect } from 'vitest'
import { isWithinDeclaredHours, computeBookingTotal, formatMoney } from './listingAvailability'
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

describe('formatMoney', () => {
  it('formats known currencies with their symbol', () => {
    expect(formatMoney('INR', 150)).toBe('₹150.00')
    expect(formatMoney('USD', 12)).toBe('$12.00')
  })

  it('falls back to the currency code for unknown currencies', () => {
    expect(formatMoney('XYZ', 10)).toBe('XYZ 10.00')
  })
})
