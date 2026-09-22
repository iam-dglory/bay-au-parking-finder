import { describe, it, expect } from 'vitest'
import { haversineMeters } from './distance'

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters({ lat: -33.87, lng: 151.21 }, { lat: -33.87, lng: 151.21 })).toBeCloseTo(0, 3)
  })

  it('matches the known length of one degree of latitude (~111.32km)', () => {
    // Latitude lines are evenly spaced regardless of longitude, so this is an
    // exact, verifiable reference distance rather than a guessed landmark pair.
    const d = haversineMeters({ lat: 0, lng: 151.2 }, { lat: 1, lng: 151.2 })
    expect(d).toBeCloseTo(111_320, -3)
  })
})
