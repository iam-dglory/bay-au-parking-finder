import { describe, expect, it } from 'vitest'
import { applyBayZoneRules, type BayZoneRules } from './melbourneZoneRules'
import { evaluateSpotStatus } from './parkingStatus'
import type { ParkingRule, ParkingSpot } from '../types'

const rule = (over: Partial<ParkingRule>): ParkingRule => ({ id: 'r', sign_type: 'PAID_METER', max_stay_minutes: 120, days_active: [1, 2, 3, 4, 5], time_from: '07:00', time_to: '16:00', price_per_hour: null, currency: 'AUD', notes: null, match_method: 'bay_id', ...over })
const spot = (kerbside_id: string | null, rules: ParkingRule[] = []): ParkingSpot => ({ id: `s${kerbside_id}`, kerbside_id, lat: -37.81, lng: 144.96, address_text: 'Queen St', suburb: null, state: 'VIC', country: 'Australia', distance_m: 0, created_by: 'council', photo_url: null, moderation_status: 'approved', rules, latest_ping: null, sensor_status: null })

// Queen St (La Trobe St to A'Beckett St): one segment, two council zones.
const data: BayZoneRules = {
  zones: {
    '7604': [rule({ id: 'meter' })],
    '7693': [rule({ id: 'lz', sign_type: 'LOADING_ZONE', max_stay_minutes: 30 }), rule({ id: 'meter-late', time_from: '16:00', time_to: '19:00' })],
  },
  bays: { '100': 7604, '200': 7693 },
}
const segmentWide = [rule({ id: 'seg-lz', sign_type: 'LOADING_ZONE', match_method: 'segment' }), rule({ id: 'seg-meter', match_method: 'segment' })]
const tuesday10am = new Date('2026-11-03T10:00:00+11:00')

describe('applyBayZoneRules', () => {
  it('gives a plain-meter bay only its own zone plates, not the segment loading zone', () => {
    const [bay] = applyBayZoneRules([spot('100', segmentWide)], data)
    expect(bay.rules.map(r => r.id)).toEqual(['meter'])
    expect(evaluateSpotStatus(bay.rules, bay.lat, bay.lng, tuesday10am).status).toBe('paid')
  })
  it('keeps the loading zone on the bay whose zone actually has one', () => {
    const [bay] = applyBayZoneRules([spot('200', segmentWide)], data)
    expect(evaluateSpotStatus(bay.rules, bay.lat, bay.lng, tuesday10am).label).toBe('Loading zone only')
  })
  it('leaves bays with no known zone on the safe read-the-sign status', () => {
    const [bay] = applyBayZoneRules([spot('999', segmentWide)], data)
    expect(evaluateSpotStatus(bay.rules, bay.lat, bay.lng, tuesday10am).status).toBe('unknown')
  })
  it('never overrides a driver-reported or field-verified rule', () => {
    const reported = [rule({ id: 'mine', match_method: 'reported', sign_type: 'TIME_LIMITED' })]
    expect(applyBayZoneRules([spot('100', reported)], data)[0].rules).toBe(reported)
  })
})
