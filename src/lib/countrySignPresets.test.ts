import { describe, it, expect } from 'vitest'
import { getSignOptionsForCountry, hasLocalPreset, GENERIC_SIGN_OPTIONS } from './countrySignPresets'

describe('getSignOptionsForCountry', () => {
  it('returns a bespoke vocabulary for countries with a preset', () => {
    const india = getSignOptionsForCountry('India')
    expect(india.some((o) => o.type === 'INFORMAL_TOLERATED')).toBe(true)

    const australia = getSignOptionsForCountry('Australia')
    expect(australia.some((o) => o.type === 'NO_STOPPING_CLEARWAY' && o.label.toLowerCase().includes('clearway'))).toBe(true)
    expect(australia.some((o) => o.type === 'ACCESSIBLE_PERMIT')).toBe(true)
  })

  it('is case- and whitespace-insensitive', () => {
    expect(getSignOptionsForCountry('  india ')).toEqual(getSignOptionsForCountry('India'))
  })

  it('falls back to the generic set for unknown or missing countries', () => {
    expect(getSignOptionsForCountry('Narnia')).toBe(GENERIC_SIGN_OPTIONS)
    expect(getSignOptionsForCountry(null)).toBe(GENERIC_SIGN_OPTIONS)
  })
})

describe('hasLocalPreset', () => {
  it('is true only for countries with a bespoke vocabulary', () => {
    expect(hasLocalPreset('India')).toBe(true)
    expect(hasLocalPreset('Wakanda')).toBe(false)
    expect(hasLocalPreset(null)).toBe(false)
  })
})
