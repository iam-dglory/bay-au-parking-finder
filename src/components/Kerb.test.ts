import { describe, expect, it } from 'vitest'
import { signNotation } from './Kerb'

describe('signNotation', () => {
  it('writes limits the way Melbourne signs do', () => {
    expect([15, 30, 60, 120, 240, null].map(signNotation)).toEqual(['¼P', '½P', '1P', '2P', '4P', 'P'])
    expect(signNotation(469)).toBeNull()
  })
})
