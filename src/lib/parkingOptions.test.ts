import { describe, expect, it } from 'vitest'
import { carParkOptions, mappedCarParkOptions, priceText, rankOptions, shortStreetName, sortParkingOptions, streetOptions, type CarParkRatesFile, type StreetRatesFile } from './parkingOptions'
import type { ParkingSpot } from '../types'

const now = new Date('2026-11-03T23:00:00Z') // Wed 10:00am Melbourne
const start = { day: 3, minute: 600 }
const bay = (id: string, address: string, extra: Partial<ParkingSpot> = {}): ParkingSpot => ({ id, address_text: address, suburb: null, state: 'VIC', country: 'Australia', lat: -37.81, lng: 144.96, distance_m: 100, created_by: 'council', photo_url: null, moderation_status: 'approved', kerbside_id: null, rules: [], latest_ping: null, sensor_status: null, ...extra })
const week = (w: [number, number, number, number][]) => Array.from({ length: 7 }, () => w)
const rates: StreetRatesFile = {
  fetched: '2026-09-26',
  zones: { '1': { days: week([[450, 1230, 550, 120]]) }, '2': { days: week([[450, 1110, 320, 240]]) } },
  streets: {
    'Queen St': { segment: 1, zones: [1], exact: true, same_price: true },
    'Mixed St': { segment: 2, zones: [1, 2], exact: false, same_price: false },
  },
}

describe('streetOptions', () => {
  it('groups bays by street and prices the stay', () => {
    const [o] = streetOptions([bay('a', 'Queen St'), bay('b', 'Queen St', { distance_m: 50 })], rates, start, 120, now)
    expect([o.cents, o.limitMinutes, o.fits, o.bayCount, o.distanceM]).toEqual([1100, 120, true, 2, 50])
  })
  it('marks a stay longer than the limit as not fitting', () => {
    expect(streetOptions([bay('a', 'Queen St')], rates, start, 180, now)[0].fits).toBe(false)
  })
  it('shows a range, not a guess, when zones on a street differ', () => {
    const [o] = streetOptions([bay('a', 'Mixed St')], rates, start, 60, now)
    expect([o.cents, o.range, o.limitMinutes]).toEqual([null, { min: 320, max: 550 }, 120])
  })
  it('leaves price unknown for streets without meter data', () => {
    const [o] = streetOptions([bay('a', 'Side St')], rates, start, 60, now)
    expect([o.cents, o.noData, priceText(o)]).toEqual([null, true, 'See sign'])
  })
})

describe('streetOptions from council signs', () => {
  // Little Bourke St (Swanston–Elizabeth): loading zone weekdays 7am–4pm, then 2P meter to 10pm.
  const signRates: StreetRatesFile = {
    ...rates,
    sign_zones: { '7514': { days: [[[420, 1320, -1, 120]], ...Array.from({ length: 5 }, () => [[420, 960, -2, 0], [960, 1320, -1, 120]] as [number, number, number, number][]), [[420, 1320, -1, 120]]], signs: ['Mon-Fri 07:00–16:00: Loading zone', 'Mon-Fri 16:00–22:00: 2P meter'] } },
    streets: { ...rates.streets, 'Little Bourke St': { segment: 20055, zones: [7514], exact: true, same_price: true, from_signs: true } },
  }
  it('says no parking during the loading zone', () => {
    const [o] = streetOptions([bay('a', 'Little Bourke St')], signRates, start, 60, now) // Wed 10am
    expect([o.noParkingAfterMinutes, o.fits, priceText(o)]).toEqual([0, false, 'No parking now'])
  })
  it('gives the meter time limit when the rate is not published', () => {
    const [o] = streetOptions([bay('a', 'Little Bourke St')], signRates, { day: 3, minute: 17 * 60 }, 60, now)
    expect([o.cents, o.priceUnpublished, o.limitMinutes, o.fits, priceText(o), o.signs?.length]).toEqual([null, true, 120, true, 'Meter', 2])
  })
  it('makes you leave before the loading zone starts', () => {
    const [o] = streetOptions([bay('a', 'Little Bourke St')], signRates, { day: 3, minute: 6 * 60 }, 120, now) // 6am, 2 hrs
    expect([o.limitMinutes, o.noParkingAfterMinutes, o.fits]).toEqual([60, 60, false])
  })
})

describe('carParkOptions + rankOptions', () => {
  const file: CarParkRatesFile = { stale_after_days: 45, car_parks: [
    { id: 'cp', name: 'Car park', operator: 'Wilson Parking', lat: -37.811, lng: 144.96, source_url: 'https://example.org', checked: '2026-11-01', rates: { casual: [{ upToMinutes: 120, cents: 3600 }] } },
    { id: 'far', name: 'Far', operator: 'X', lat: -37.9, lng: 145.1, source_url: 'https://example.org', checked: '2026-11-01', rates: { casual: [{ upToMinutes: 120, cents: 100 }] } },
    { id: 'nomap', name: 'No map', operator: 'X', lat: null, lng: null, source_url: 'https://example.org', checked: '2026-11-01', rates: { casual: [] } },
  ] }
  it('includes only mapped car parks within the radius', () => {
    expect(carParkOptions(file, { lat: -37.81, lng: 144.96 }, 1000, start, 120, now).map(o => o.id)).toEqual(['cp'])
  })
  it('ranks cheapest fitting options first', () => {
    const street = streetOptions([bay('a', 'Queen St'), bay('c', 'Side St')], rates, start, 120, now)
    const ranked = rankOptions([...carParkOptions(file, { lat: -37.81, lng: 144.96 }, 1000, start, 120, now), ...street])
    expect(ranked.map(o => o.name)).toEqual(['Queen St', 'Car park', 'Side St'])
  })
})

describe('shortStreetName', () => {
  it('shortens council segment descriptions', () => {
    expect(shortStreetName("Queen Street between La Trobe Street and A'Beckett Street")).toBe("Queen St · La Trobe–A'Beckett")
    expect(shortStreetName('Flinders Lane')).toBe('Flinders Ln')
  })
})

describe('mappedCarParkOptions vehicle types', () => {
  const area = (id: string, vehicle_types?: string) => ({ id, kind: 'area', address_text: id, lat: -37.81, lng: 144.96, distance_m: 50, fee: 'no', vehicle_types }) as never
  it('leaves out motorbike-only areas', () => {
    const ids = mappedCarParkOptions([area('bikes', 'Two-wheelers'), area('both', 'Cars and two-wheelers'), area('plain')], 60).map(o => o.name)
    expect(ids).toEqual(['both', 'plain'])
  })
})

describe('sortParkingOptions', () => {
  const option = (id: string, distanceM: number, cents: number | null, free?: number) => ({
    kind: 'street' as const, id, name: id, lat: -37.81, lng: 144.96, distanceM,
    cents, limitMinutes: 120, fits: true, source: { label: 'test', date: '2026-11-14' },
    ...(free == null ? {} : { live: { free, reporting: 10 + free } }),
  })
  it('keeps all three driver-facing orders deterministic', () => {
    const rows = [option('near', 20, null), option('cheap', 100, 200), option('live', 300, 500, 4)]
    expect(sortParkingOptions(rows, 'nearest').map(row => row.id)).toEqual(['near', 'cheap', 'live'])
    expect(sortParkingOptions(rows, 'cheapest').map(row => row.id)).toEqual(['cheap', 'live', 'near'])
    expect(sortParkingOptions(rows, 'available').map(row => row.id)).toEqual(['live', 'near', 'cheap'])
  })
  it('puts "see sign" places behind ones with a price, limit or meter in Nearest', () => {
    const unknown = { ...option('sign', 10, null), limitMinutes: null, fits: null }
    const rows = [unknown, option('priced', 200, 400), { ...option('blocked', 5, null), fits: false }]
    expect(sortParkingOptions(rows, 'nearest').map(row => row.id)).toEqual(['priced', 'sign', 'blocked'])
  })
})

describe('mappedCarParkOptions', () => {
  it('keeps mapped facilities visible and turns published hourly rates into stay totals', () => {
    const rows = mappedCarParkOptions([{ id: 'spencer', address_text: 'Spencer Street Car Park', suburb: 'Melbourne', lat: -37.8183, lng: 144.9531, distance_m: 120, capacity: 300, census_year: 2025, kind: 'area', hourly_rate_min: 6, hourly_rate_max: 8, source_name: 'Verified operator' }], 120)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: 'mapped:spencer', range: { min: 1200, max: 1600 }, fits: true })
  })
})

describe('streetOptionHere', () => {
  it('finds the street whose bay is closest, within 40 m', async () => {
    const { streetOptionHere } = await import('./parkingOptions')
    const opts = streetOptions([bay('a', 'Queen St', { lat: -37.81, lng: 144.96 }), bay('b', 'Side St', { lat: -37.8103, lng: 144.96 })], rates, start, 60, now)
    expect(streetOptionHere(opts, { lat: -37.8101, lng: 144.96 })?.option.name).toBe('Queen St')
    expect(streetOptionHere(opts, { lat: -37.815, lng: 144.96 })).toBeNull()
  })
})
