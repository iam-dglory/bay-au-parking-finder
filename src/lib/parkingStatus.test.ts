import { describe, it, expect } from 'vitest'
import { evaluateSpotStatus, rankSpots } from './parkingStatus'
import type { ParkingRule, ParkingSpot } from '../types'

function rule(overrides: Partial<ParkingRule>): ParkingRule {
  return {
    id: 'r1',
    sign_type: 'TIME_LIMITED',
    max_stay_minutes: 120,
    days_active: [1, 2, 3, 4, 5],
    time_from: '08:30',
    time_to: '18:00',
    price_per_hour: null,
    currency: null,
    notes: null,
    ...overrides,
  }
}

// Wed 2026-08-05 (a Wednesday) at various times, in UTC — paired with the
// (0, 0) "Null Island" coordinates used throughout this file, which tz-lookup
// resolves to the permanently-UTC+0, no-DST zone 'Etc/GMT'. Building via
// Date.UTC (rather than the local Date constructor) keeps these tests correct
// regardless of the machine/CI's own timezone, now that evaluation happens in
// the *spot's* timezone rather than the device's.
function dateAt(hh: number, mm: number, day = 5) {
  // day: 0=Sun..6=Sat; 2026-08-02 is a Sunday
  return new Date(Date.UTC(2026, 7, 2 + day, hh, mm, 0))
}

// "Null Island" (0, 0) — resolves via tz-lookup to 'Etc/GMT', matching dateAt's UTC construction.
const LAT = 0
const LNG = 0

describe('evaluateSpotStatus', () => {
  it('is free outside the signed restriction window', () => {
    const status = evaluateSpotStatus([rule({})], LAT, LNG, dateAt(20, 0)) // 8pm, after 6pm cutoff
    expect(status.status).toBe('free')
  })

  it('is time-limited-free inside the window', () => {
    const status = evaluateSpotStatus([rule({})], LAT, LNG, dateAt(10, 0))
    expect(status.status).toBe('free')
    expect(status.label).toMatch(/max stay/i)
    expect(status.changesAt?.getUTCHours()).toBe(18)
  })

  it('is paid inside a paid meter window', () => {
    const status = evaluateSpotStatus(
      [rule({ sign_type: 'PAID_METER', max_stay_minutes: null, price_per_hour: 6.5, days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
      LAT,
      LNG,
      dateAt(10, 0),
    )
    expect(status.status).toBe('paid')
    expect(status.price_per_hour).toBe(6.5)
  })

  it('treats accessible/ACROD permit parking as restricted', () => {
    const status = evaluateSpotStatus(
      [rule({ sign_type: 'ACCESSIBLE_PERMIT', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
      LAT,
      LNG,
      dateAt(10, 0),
    )
    expect(status.status).toBe('restricted')
  })

  it('surfaces a max-stay limit on a paid/ticket sign (e.g. AU "2P Ticket")', () => {
    const status = evaluateSpotStatus(
      [
        rule({
          sign_type: 'PAID_METER',
          max_stay_minutes: 120,
          price_per_hour: 3.5,
          days_active: [0, 1, 2, 3, 4, 5, 6],
          time_from: '00:00',
          time_to: '23:59',
        }),
      ],
      LAT,
      LNG,
      dateAt(10, 0),
    )
    expect(status.status).toBe('paid')
    expect(status.label).toMatch(/max 2h/)
  })

  it('treats permit-only as restricted', () => {
    const status = evaluateSpotStatus(
      [rule({ sign_type: 'PERMIT_ONLY', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
      LAT,
      LNG,
      dateAt(10, 0),
    )
    expect(status.status).toBe('restricted')
  })

  it('handles a clearway window that wraps past midnight', () => {
    const clearway = rule({ sign_type: 'NO_STOPPING_CLEARWAY', days_active: [1, 2, 3, 4, 5], time_from: '22:00', time_to: '06:00' })
    expect(evaluateSpotStatus([clearway], LAT, LNG, dateAt(23, 0)).status).toBe('restricted')
    expect(evaluateSpotStatus([clearway], LAT, LNG, dateAt(2, 0)).status).toBe('restricted')
    expect(evaluateSpotStatus([clearway], LAT, LNG, dateAt(10, 0)).status).toBe('free')
  })

  it('picks the most restrictive of multiple simultaneously-active rules', () => {
    const generic = rule({ sign_type: 'TIME_LIMITED', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })
    const loading = rule({ id: 'r2', sign_type: 'LOADING_ZONE', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '06:00', time_to: '10:00' })
    const status = evaluateSpotStatus([generic, loading], LAT, LNG, dateAt(7, 0))
    expect(status.status).toBe('restricted')
  })

  it('keeps missing rules unknown rather than free', () => {
    const status = evaluateSpotStatus([], LAT, LNG, dateAt(10, 0))
    expect(status.status).toBe('unknown')
  })

  it('treats informally-tolerated parking (e.g. India) as free but distinctly labelled', () => {
    const status = evaluateSpotStatus([rule({ sign_type: 'INFORMAL_TOLERATED', time_from: null, time_to: null })], LAT, LNG, dateAt(10, 0))
    expect(status.status).toBe('free')
    expect(status.label).toBe('Informally okay')
  })

  it('evaluates against the spot\'s own timezone, not the device\'s', () => {
    // Sydney is UTC+10 in early-Sept (before AU daylight saving starts).
    // 10:00 UTC is 20:00 in Sydney -- outside an 8:30am-6pm window there,
    // even though 10:00 would be *inside* that window read as device-local UTC.
    const sydneyLat = -33.8688
    const sydneyLng = 151.2093
    const utc10am = new Date(Date.UTC(2026, 8, 2, 10, 0, 0)) // Wed 2 Sept 2026, 10:00 UTC = 20:00 AEST
    const status = evaluateSpotStatus([rule({})], sydneyLat, sydneyLng, utc10am)
    expect(status.status).toBe('free') // 8pm Sydney time is after the 6pm cutoff
    expect(status.detail).toBe('Outside signed restriction hours')
  })
})

describe('rankSpots', () => {
  function spot(overrides: Partial<ParkingSpot>): ParkingSpot {
    return {
      id: 's1',
      address_text: 'Test St',
      suburb: null,
      state: null,
      country: null,
      latest_ping: null,
      sensor_status: null,
      photo_url: null,
      moderation_status: 'approved',
      kerbside_id: null,
      lat: 0,
      lng: 0,
      distance_m: 100,
      created_by: 'u1',
      rules: [],
      ...overrides,
    }
  }

  it('ranks free before paid before restricted', () => {
    const now = dateAt(10, 0)
    const free = spot({ id: 'free', rules: [rule({ sign_type: 'FREE_UNLIMITED', time_from: null, time_to: null })] })
    const paid = spot({
      id: 'paid',
      rules: [rule({ sign_type: 'PAID_METER', price_per_hour: 5, days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
    })
    const restricted = spot({
      id: 'restricted',
      rules: [rule({ sign_type: 'PERMIT_ONLY', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
    })
    const ranked = rankSpots([restricted, paid, free], now)
    expect(ranked.map((s) => s.id)).toEqual(['free', 'paid', 'restricted'])
  })

  it('ranks closer spots first among equally-free options', () => {
    const now = dateAt(10, 0)
    const near = spot({ id: 'near', distance_m: 50, rules: [rule({ sign_type: 'FREE_UNLIMITED', time_from: null, time_to: null })] })
    const far = spot({ id: 'far', distance_m: 500, rules: [rule({ sign_type: 'FREE_UNLIMITED', time_from: null, time_to: null })] })
    const ranked = rankSpots([far, near], now)
    expect(ranked.map((s) => s.id)).toEqual(['near', 'far'])
  })

  it('ranks cheaper paid spots before pricier ones', () => {
    const now = dateAt(10, 0)
    const cheap = spot({
      id: 'cheap',
      distance_m: 500,
      rules: [rule({ sign_type: 'PAID_METER', price_per_hour: 3, days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
    })
    const pricey = spot({
      id: 'pricey',
      distance_m: 50,
      rules: [rule({ sign_type: 'PAID_METER', price_per_hour: 9, days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
    })
    const ranked = rankSpots([pricey, cheap], now)
    expect(ranked.map((s) => s.id)).toEqual(['cheap', 'pricey'])
  })
})
