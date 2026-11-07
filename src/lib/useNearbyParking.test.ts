import { describe, expect, it } from 'vitest'
import { isMelbourneSearch } from './melbourneSensors'

describe('Melbourne coverage', () => {
  it('treats the CBD as Melbourne and other cities as out of coverage', () => {
    expect(isMelbourneSearch(-37.8105, 144.9607)).toBe(true)
    expect(isMelbourneSearch(-33.8688, 151.2093)).toBe(false) // Sydney
    expect(isMelbourneSearch(40.7128, -74.006)).toBe(false) // New York
  })
})
