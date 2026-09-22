import { describe, it, expect } from 'vitest'
import { formatMaxStay } from './formatDuration'

describe('formatMaxStay', () => {
  it('shows sub-hour durations in minutes', () => {
    expect(formatMaxStay(10)).toBe('10 min')
    expect(formatMaxStay(30)).toBe('30 min')
  })

  it('shows whole hours without a decimal', () => {
    expect(formatMaxStay(60)).toBe('1h')
    expect(formatMaxStay(120)).toBe('2h')
  })

  it('shows fractional hours to one decimal place', () => {
    expect(formatMaxStay(90)).toBe('1.5h')
  })

  it('never produces a long floating-point tail (e.g. a real 10-minute Brisbane sign)', () => {
    expect(formatMaxStay(10)).not.toMatch(/\d{5,}/)
  })
})
