import { describe, it, expect } from 'vitest'
import { getOccupancyInfo, formatOccupancyAge } from './occupancy'

const now = new Date('2026-09-18T12:00:00Z')

function pingMinutesAgo(minutes: number, status: 'occupied' | 'free' = 'occupied') {
  return { status, created_at: new Date(now.getTime() - minutes * 60_000).toISOString() }
}

describe('getOccupancyInfo', () => {
  it('returns unknown when there is no ping at all', () => {
    expect(getOccupancyInfo(null, now)).toEqual({ status: 'unknown', ageMinutes: null })
  })

  it('surfaces a fresh occupied ping with its age', () => {
    const info = getOccupancyInfo(pingMinutesAgo(4, 'occupied'), now)
    expect(info).toEqual({ status: 'occupied', ageMinutes: 4 })
  })

  it('surfaces a fresh free ping with its age', () => {
    const info = getOccupancyInfo(pingMinutesAgo(10, 'free'), now)
    expect(info).toEqual({ status: 'free', ageMinutes: 10 })
  })

  it('treats a ping older than the freshness window as unknown, not stale-true', () => {
    const info = getOccupancyInfo(pingMinutesAgo(31), now, 30)
    expect(info.status).toBe('unknown')
  })

  it('treats a ping exactly at the freshness boundary as still fresh', () => {
    const info = getOccupancyInfo(pingMinutesAgo(30), now, 30)
    expect(info.status).toBe('occupied')
  })
})

describe('formatOccupancyAge', () => {
  it('says "just now" for sub-minute ages', () => {
    expect(formatOccupancyAge(0)).toBe('just now')
  })

  it('uses singular for exactly 1 minute', () => {
    expect(formatOccupancyAge(1)).toBe('1 min ago')
  })

  it('uses plural for multiple minutes', () => {
    expect(formatOccupancyAge(15)).toBe('15 min ago')
  })
})
