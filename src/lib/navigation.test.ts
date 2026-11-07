import { describe, expect, it } from 'vitest'
import { navigationUrl } from './navigation'

describe('navigationUrl', () => {
  it('opens the chosen app in driving mode', () => {
    expect(navigationUrl(-37.81, 144.96, 'google', 'android')).toBe('google.navigation:q=-37.81%2C144.96&mode=d')
    expect(navigationUrl(-37.81, 144.96, 'google', 'web')).toContain('google.com/maps/dir/?api=1&destination=-37.81%2C144.96&travelmode=driving')
    expect(navigationUrl(-37.81, 144.96, 'apple', 'ios')).toBe('maps://?daddr=-37.81%2C144.96&dirflg=d')
    expect(navigationUrl(-37.81, 144.96, 'waze', 'android')).toBe('https://waze.com/ul?ll=-37.81%2C144.96&navigate=yes')
  })
})
