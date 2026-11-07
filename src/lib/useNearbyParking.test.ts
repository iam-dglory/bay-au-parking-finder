import { describe, expect, it } from 'vitest'
import { isAustraliaSearch } from './nationalParking'
import { isMelbourneSearch } from './melbourneSensors'

describe('data source for Melbourne', () => {
  it('Melbourne is inside the Australia box, so it must be excluded explicitly from catalog-only mode', () => {
    const queenSt = { lat: -37.8105, lng: 144.9607 }
    expect(isAustraliaSearch(queenSt.lat, queenSt.lng)).toBe(true)
    expect(isMelbourneSearch(queenSt.lat, queenSt.lng)).toBe(true)
  })
})
