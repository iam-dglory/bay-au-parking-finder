import { describe, expect, it } from 'vitest'
import { directionsUrl } from './directions'

describe('parking directions', () => {
  it('always uses the displayed latitude and longitude as a driving destination', () => {
    expect(directionsUrl(13.0827, 80.2707)).toBe('https://www.google.com/maps/dir/?api=1&destination=13.0827%2C80.2707&travelmode=driving')
  })

  it('rejects invalid imported coordinates instead of sending a user elsewhere', () => {
    expect(directionsUrl(95, 80)).toBeNull()
    expect(directionsUrl(13, Number.NaN)).toBeNull()
  })
})
