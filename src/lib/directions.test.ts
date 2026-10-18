import { describe, expect, it } from 'vitest'
import { directionsUrl } from './directions'

describe('parking directions', () => {
  it('always uses the displayed latitude and longitude as a driving destination', () => {
    expect(directionsUrl(13.0827, 80.2707, 'web')).toBe('https://www.google.com/maps/dir/?api=1&destination=13.0827%2C80.2707&travelmode=driving')
  })

  it('opens the installed navigation app directly on phones', () => {
    expect(directionsUrl(13.0827, 80.2707, 'android')).toBe('google.navigation:q=13.0827%2C80.2707&mode=d')
    expect(directionsUrl(13.0827, 80.2707, 'ios')).toBe('maps://?daddr=13.0827%2C80.2707&dirflg=d')
  })

  it('rejects invalid imported coordinates instead of sending a user elsewhere', () => {
    expect(directionsUrl(95, 80)).toBeNull()
    expect(directionsUrl(13, Number.NaN)).toBeNull()
  })
})
