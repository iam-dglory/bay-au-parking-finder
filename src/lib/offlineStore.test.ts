import { describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) })

const { metresBetween, withOfflineCopy } = await import('./offlineStore')

describe('withOfflineCopy', () => {
  it('returns the last good copy when the network fails', async () => {
    expect(await withOfflineCopy('rates', async () => ({ v: 1 }))).toEqual({ v: 1 })
    await new Promise(r => setTimeout(r, 0))
    expect(await withOfflineCopy('rates', async () => { throw new TypeError('Failed to fetch') })).toEqual({ v: 1 })
  })
  it('still fails when there is no copy', async () => {
    await expect(withOfflineCopy('never-saved', async () => { throw new Error('offline') })).rejects.toThrow('offline')
  })
})

describe('metresBetween', () => {
  it('is about 1.1 km for 0.01 degrees of latitude', () => {
    expect(Math.round(metresBetween({ lat: -37.81, lng: 144.96 }, { lat: -37.82, lng: 144.96 }) / 10) * 10).toBe(1110)
  })
})
