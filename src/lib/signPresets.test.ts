import { describe, it, expect } from 'vitest'
import { SIGN_OPTIONS } from './signPresets'

describe('Melbourne sign options', () => {
  it('uses Victorian sign vocabulary', () => {
    expect(SIGN_OPTIONS.some((o) => o.type === 'NO_STOPPING_CLEARWAY' && o.label.toLowerCase().includes('clearway'))).toBe(true)
    expect(SIGN_OPTIONS.some((o) => o.type === 'LOADING_ZONE')).toBe(true)
    expect(SIGN_OPTIONS.some((o) => o.type === 'INFORMAL_TOLERATED')).toBe(false)
  })
})
