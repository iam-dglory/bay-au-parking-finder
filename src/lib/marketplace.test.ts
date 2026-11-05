import { describe, expect, it } from 'vitest'
import {
  calculateBookingAmounts,
  calculateMarketplaceAmounts,
  cancellationRefundPercent,
  effectivePriceRange,
  formatListingPrice,
  validateHostPrice,
  type MarketplaceListingSummary,
} from './marketplace'

const listing: MarketplaceListingSummary = {
  id: 'listing-1', title: 'Secure apartment bay', address_text: '1 Bay Street', suburb: 'Melbourne', state: 'VIC', country: 'Australia',
  lat: -37.81, lng: 144.96, distance_m: 180, photo_url: null, space_type: 'apartment_bay', currency: 'AUD',
  price_per_hour: 6, price_per_day: 30, price_per_week: null, price_per_month: null, price_per_year: null, instant_book: false,
}

describe('marketplace pricing', () => {
  it('formats the shortest available price period', () => {
    expect(formatListingPrice(listing)).toBe('$6.00/hour')
  })

  it('calculates a platform fee without floating point money', () => {
    expect(calculateMarketplaceAmounts(5_000, 1200)).toEqual({ subtotalCents: 5_000, platformFeeCents: 600, hostPayoutCents: 4_400 })
  })

  it('rejects an invalid fee', () => {
    expect(() => calculateMarketplaceAmounts(5_000, 10_001)).toThrow()
  })

  it('uses the lower of the location and space-type hourly maximum', () => {
    expect(effectivePriceRange({ minCents: 400, maxCents: 2000 }, { hourMaxCents: 1200, dayMaxCents: 4500 }, 'hour')).toEqual({ minCents: 400, maxCents: 1200 })
    expect(effectivePriceRange({ minCents: 300, maxCents: 1500 }, { hourMaxCents: 2000, dayMaxCents: 8000 }, 'hour')).toEqual({ minCents: 300, maxCents: 1500 })
  })

  it('uses the location band for weekly and monthly prices', () => {
    expect(effectivePriceRange({ minCents: 7000, maxCents: 25000 }, { hourMaxCents: 1200, dayMaxCents: 4500 }, 'week')).toEqual({ minCents: 7000, maxCents: 25000 })
  })

  it('validates host prices in integer cents', () => {
    const range = { minCents: 300, maxCents: 1200 }
    expect(validateHostPrice(800, range).valid).toBe(true)
    expect(validateHostPrice(1600, range).valid).toBe(false)
    expect(validateHostPrice(800.5, range).valid).toBe(false)
  })

  it('applies the 5% launch policy and minimum subtotal', () => {
    expect(calculateBookingAmounts(500, 2, 500, 500)).toEqual({ subtotalCents: 1000, platformFeeCents: 50, hostPayoutCents: 950 })
    expect(() => calculateBookingAmounts(200, 2, 500, 500)).toThrow(/minimum/i)
  })

  it('calculates draft cancellation refunds at policy boundaries', () => {
    expect(cancellationRefundPercent(25)).toBe(100)
    expect(cancellationRefundPercent(24)).toBe(75)
    expect(cancellationRefundPercent(6)).toBe(75)
    expect(cancellationRefundPercent(5.9)).toBe(50)
    expect(cancellationRefundPercent(-0.1)).toBe(0)
    expect(cancellationRefundPercent(-1, true)).toBe(100)
  })
})
