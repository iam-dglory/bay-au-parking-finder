import { describe, expect, it } from 'vitest'
import { coverageRadiusForZoom, zoomForRadius } from './mapZoom'

describe('map zoom coverage', () => {
  it('matches the selected nearby radius at normal street zoom', () => {
    expect(zoomForRadius(500)).toBe(16)
    expect(coverageRadiusForZoom(16)).toBe(500)
    expect(coverageRadiusForZoom(14)).toBe(2_000)
  })

  it('widens data coverage when exploring a suburb or city', () => {
    expect(coverageRadiusForZoom(12)).toBe(10_000)
    expect(coverageRadiusForZoom(10)).toBe(20_000)
  })
})
