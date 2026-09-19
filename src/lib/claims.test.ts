import { describe, it, expect } from 'vitest'
import { getClaimInfo } from './claims'

const now = new Date('2026-09-19T12:00:00Z')

describe('getClaimInfo', () => {
  it('is inactive when there is no claim', () => {
    expect(getClaimInfo(null, now)).toEqual({ active: false, minutesLeft: 0 })
  })

  it('is active with minutes remaining for a live claim', () => {
    const claim = { expires_at: new Date(now.getTime() + 15 * 60_000).toISOString() }
    const info = getClaimInfo(claim, now)
    expect(info.active).toBe(true)
    expect(info.minutesLeft).toBe(15)
  })

  it('is inactive once the claim has expired', () => {
    const claim = { expires_at: new Date(now.getTime() - 1000).toISOString() }
    expect(getClaimInfo(claim, now)).toEqual({ active: false, minutesLeft: 0 })
  })

  it('is inactive at the exact expiry instant', () => {
    const claim = { expires_at: now.toISOString() }
    expect(getClaimInfo(claim, now).active).toBe(false)
  })
})
