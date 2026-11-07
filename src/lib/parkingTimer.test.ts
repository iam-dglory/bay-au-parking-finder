import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))

const store = new Map<string, string>()
vi.stubGlobal('window', Object.assign(globalThis.window ?? {}, {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
  setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
}))

describe('parking timer', () => {
  afterEach(() => { store.clear(); vi.useRealTimers() })
  const session = (leaveInMinutes: number) => ({ name: 'Queen St', lat: -37.81, lng: 144.96, kind: 'street' as const, startedAt: new Date().toISOString(), leaveBy: new Date(Date.now() + leaveInMinutes * 60_000).toISOString() })

  it('saves the session on the device and clears it when ended', async () => {
    const { startParking, readSession, endParking } = await import('./parkingTimer')
    const result = await startParking(session(120))
    expect(result).toBe('in-app-only')
    expect(readSession()?.name).toBe('Queen St')
    await endParking()
    expect(readSession()).toBeNull()
  })
  it('forgets a session that ended more than 12 hours ago', async () => {
    const { readSession } = await import('./parkingTimer')
    store.set('bay.parking-timer.v1', JSON.stringify(session(-13 * 60)))
    expect(readSession()).toBeNull()
  })
})
