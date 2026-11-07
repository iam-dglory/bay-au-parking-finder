import { describe, expect, it } from 'vitest'
import { INITIAL_DRIVING, nextDrivingState, type Fix } from './driving'

const run = (fixes: Fix[]) => fixes.reduce(nextDrivingState, INITIAL_DRIVING)
const at = (s: number, speed: number | null, lat = -37.81): Fix => ({ lat, lng: 144.96, time: s * 1000, speed })

describe('driving detection', () => {
  it('needs 8 seconds above 15 km/h before switching on', () => {
    expect(run([at(0, 10), at(5, 10)]).moving).toBe(false)
    expect(run([at(0, 10), at(5, 10), at(9, 10)]).moving).toBe(true)
  })
  it('ignores a single GPS jump', () => {
    expect(run([at(0, 0), at(1, 30), at(2, 0), at(12, 0)]).moving).toBe(false)
  })
  it('stays on through a short red light and switches off after 45 s stopped', () => {
    const driving = [at(0, 12), at(10, 12)]
    expect(run([...driving, at(11, 0), at(40, 0)]).moving).toBe(true)
    expect(run([...driving, at(11, 0), at(57, 0)]).moving).toBe(false)
  })
  it('works out speed from positions when the phone does not report it', () => {
    // ~111 m every 5 s = ~80 km/h
    expect(run([at(0, null, -37.81), at(5, null, -37.811), at(10, null, -37.812), at(15, null, -37.813)]).moving).toBe(true)
  })
})
