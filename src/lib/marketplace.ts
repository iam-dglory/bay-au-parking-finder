export type MarketplacePricePeriod = 'hour' | 'day' | 'week' | 'month'
export type MarketplaceSpaceType = 'open_driveway' | 'uncovered_bay' | 'covered_bay' | 'private_garage' | 'apartment_bay' | 'commercial_space'

export interface MarketplaceListingSummary {
  id: string
  title: string
  address_text: string
  suburb: string | null
  state: string | null
  country: string
  lat: number
  lng: number
  distance_m: number
  photo_url: string | null
  space_type: string
  currency: string
  price_per_hour: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  price_per_year?: number | null
  instant_book: boolean
}

export const MARKETPLACE_PERIODS: { period: MarketplacePricePeriod; label: string }[] = [
  { period: 'hour', label: 'Hourly' },
  { period: 'day', label: 'Daily' },
  { period: 'week', label: 'Weekly' },
  { period: 'month', label: 'Monthly' },
]

export const MARKETPLACE_SPACE_TYPES = [
  { value: 'open_driveway', label: 'Open driveway', description: 'An off-street driveway controlled by the host.' },
  { value: 'uncovered_bay', label: 'Uncovered private bay', description: 'A marked private bay without a roof.' },
  { value: 'covered_bay', label: 'Covered parking bay', description: 'A private bay protected by a roof or structure.' },
  { value: 'private_garage', label: 'Private garage', description: 'An enclosed garage with controlled access.' },
  { value: 'apartment_bay', label: 'Apartment parking bay', description: 'A bay the host is authorised to offer.' },
  { value: 'commercial_space', label: 'Authorised commercial space', description: 'A business-controlled space approved for marketplace use.' },
] as const

export type MarketplacePriceRange = { minCents: number; maxCents: number }
export type MarketplaceTypeCaps = { hourMaxCents: number; dayMaxCents: number }

/** Pure policy calculation. Bands, caps and fees must be loaded from the
 * versioned server policy; this helper deliberately contains no commercial
 * constants so a browser release cannot silently drift from the database. */
export function effectivePriceRange(band: MarketplacePriceRange, typeCaps: MarketplaceTypeCaps, period: MarketplacePricePeriod) {
  const maxCents = period === 'hour' ? Math.min(band.maxCents, typeCaps.hourMaxCents) : period === 'day' ? Math.min(band.maxCents, typeCaps.dayMaxCents) : band.maxCents
  return { minCents: band.minCents, maxCents }
}

export function validateHostPrice(priceCents: number, range: MarketplacePriceRange) {
  if (!Number.isInteger(priceCents)) return { valid: false, message: 'Use a whole number of cents.' }
  if (priceCents < range.minCents) return { valid: false, message: `Price must be at least ${formatAudCents(range.minCents)}.` }
  if (priceCents > range.maxCents) return { valid: false, message: `Price must not exceed ${formatAudCents(range.maxCents)}.` }
  return { valid: true, message: null }
}

export function listingPrices(listing: MarketplaceListingSummary) {
  return [
    { period: 'hour' as const, amount: listing.price_per_hour },
    { period: 'day' as const, amount: listing.price_per_day },
    { period: 'week' as const, amount: listing.price_per_week },
    { period: 'month' as const, amount: listing.price_per_month },
  ].filter((price): price is { period: MarketplacePricePeriod; amount: number } => price.amount != null && price.amount > 0)
}

export function formatListingPrice(listing: MarketplaceListingSummary) {
  const first = listingPrices(listing)[0]
  if (!first) return 'Price on request'
  const amount = new Intl.NumberFormat('en-AU', { style: 'currency', currency: listing.currency, maximumFractionDigits: 2 }).format(first.amount)
  return `${amount}/${first.period}`
}

/** All money is calculated in integer cents. The server repeats this
 * calculation and remains authoritative before any payment is created. */
export function calculateMarketplaceAmounts(subtotalCents: number, platformFeeBps: number) {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) throw new Error('Subtotal must be a non-negative integer')
  if (!Number.isInteger(platformFeeBps) || platformFeeBps < 0 || platformFeeBps > 10_000) throw new Error('Fee basis points must be between 0 and 10000')
  const platformFeeCents = Math.round((subtotalCents * platformFeeBps) / 10_000)
  return { subtotalCents, platformFeeCents, hostPayoutCents: subtotalCents - platformFeeCents }
}

export function calculateBookingAmounts(unitPriceCents: number, quantity: number, commissionBps: number, minimumSubtotalCents: number) {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) throw new Error('Unit price must be a positive integer')
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive integer')
  const subtotalCents = unitPriceCents * quantity
  if (!Number.isInteger(minimumSubtotalCents) || minimumSubtotalCents <= 0) throw new Error('Minimum subtotal must be a positive integer')
  if (subtotalCents < minimumSubtotalCents) throw new Error('Booking subtotal is below the configured minimum')
  return calculateMarketplaceAmounts(subtotalCents, commissionBps)
}

export function cancellationRefundPercent(hoursBeforeStart: number, cancelledByHost = false, verifiedAccessFailure = false) {
  if (cancelledByHost || verifiedAccessFailure) return 100
  if (!Number.isFinite(hoursBeforeStart)) throw new Error('Hours before start must be finite')
  if (hoursBeforeStart > 24) return 100
  if (hoursBeforeStart >= 6) return 75
  if (hoursBeforeStart >= 0) return 50
  return 0
}

export function formatAudCents(cents: number) {
  if (!Number.isInteger(cents)) throw new Error('Money must use integer cents')
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)
}
