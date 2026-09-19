import { describe, it, expect } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
  it('formats known currencies with their symbol', () => {
    expect(formatMoney('INR', 150)).toBe('₹150.00')
    expect(formatMoney('USD', 12)).toBe('$12.00')
  })

  it('falls back to the currency code for unknown currencies', () => {
    expect(formatMoney('XYZ', 10)).toBe('XYZ 10.00')
  })
})
