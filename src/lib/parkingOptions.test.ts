import { describe, expect, it } from 'vitest'
import { carParkOptions, rankOptions, shortStreetName, streetOptions, type CarParkRatesFile, type StreetRatesFile } from './parkingOptions'
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
    expect(streetOptions([bay('a', 'Side St')], rates, start, 60, now)[0].cents).toBeNull()
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

describe('streetOptionHere', () => {
  it('finds the street whose bay is closest, within 40 m', async () => {
    const { streetOptionHere } = await import('./parkingOptions')
    const opts = streetOptions([bay('a', 'Queen St', { lat: -37.81, lng: 144.96 }), bay('b', 'Side St', { lat: -37.8103, lng: 144.96 })], rates, start, 60, now)
    expect(streetOptionHere(opts, { lat: -37.8101, lng: 144.96 })?.option.name).toBe('Queen St')
    expect(streetOptionHere(opts, { lat: -37.815, lng: 144.96 })).toBeNull()
  })
})
