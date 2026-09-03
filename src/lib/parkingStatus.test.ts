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
    notes: null,
    ...overrides,
  }
}

// Wed 2026-08-05 (a Wednesday) at various times
function dateAt(hh: number, mm: number, day = 5) {
  // day: 0=Sun..6=Sat; 2026-08-02 is a Sunday
  const d = new Date(2026, 7, 2 + day, hh, mm, 0)
  return d
}

describe('evaluateSpotStatus', () => {
  it('is free outside the signed restriction window', () => {
    const status = evaluateSpotStatus([rule({})], dateAt(20, 0)) // 8pm, after 6pm cutoff
    expect(status.status).toBe('free')
  })

  it('is time-limited-free inside the window', () => {
    const status = evaluateSpotStatus([rule({})], dateAt(10, 0))
    expect(status.status).toBe('free')
    expect(status.label).toMatch(/max stay/i)
    expect(status.changesAt?.getHours()).toBe(18)
  })

  it('is paid inside a paid meter window', () => {
    const status = evaluateSpotStatus(
      [rule({ sign_type: 'PAID_METER', max_stay_minutes: null, price_per_hour: 6.5, days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
      dateAt(10, 0),
    )
    expect(status.status).toBe('paid')
    expect(status.price_per_hour).toBe(6.5)
  })

  it('treats permit-only as restricted', () => {
    const status = evaluateSpotStatus(
      [rule({ sign_type: 'PERMIT_ONLY', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })],
      dateAt(10, 0),
    )
    expect(status.status).toBe('restricted')
  })

  it('handles a clearway window that wraps past midnight', () => {
    const clearway = rule({ sign_type: 'NO_STOPPING_CLEARWAY', days_active: [1, 2, 3, 4, 5], time_from: '22:00', time_to: '06:00' })
    expect(evaluateSpotStatus([clearway], dateAt(23, 0)).status).toBe('restricted')
    expect(evaluateSpotStatus([clearway], dateAt(2, 0)).status).toBe('restricted')
    expect(evaluateSpotStatus([clearway], dateAt(10, 0)).status).toBe('free')
  })

  it('picks the most restrictive of multiple simultaneously-active rules', () => {
    const generic = rule({ sign_type: 'TIME_LIMITED', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '00:00', time_to: '23:59' })
    const loading = rule({ id: 'r2', sign_type: 'LOADING_ZONE', days_active: [0, 1, 2, 3, 4, 5, 6], time_from: '06:00', time_to: '10:00' })
    const status = evaluateSpotStatus([generic, loading], dateAt(7, 0))
    expect(status.status).toBe('restricted')
  })

  it('falls back to free/unknown when there are no rules', () => {
    const status = evaluateSpotStatus([], dateAt(10, 0))
    expect(status.status).toBe('free')
  })
})

describe('rankSpots', () => {
  function spot(overrides: Partial<ParkingSpot>): ParkingSpot {
    return {
      id: 's1',
      address_text: 'Test St',
      suburb: null,
      state: null,
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
