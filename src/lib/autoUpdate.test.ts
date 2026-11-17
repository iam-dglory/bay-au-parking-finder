import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))
vi.stubGlobal('__BAY_BUILD__', 'build-a')
const store = new Map<string, string>()
const reload = vi.fn()
vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), clear: () => store.clear() })
vi.stubGlobal('window', { location: { reload } })
vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() })

const { startAutoUpdate } = await import('./autoUpdate')

describe('startAutoUpdate', () => {
  beforeEach(() => {
    store.clear()
    reload.mockReset()
  })
  const reply = (build: string) => vi.fn(async () => new Response(JSON.stringify({ build })))

  it('reloads once when a newer build is live', async () => {
    const stop = startAutoUpdate(reply('build-b') as unknown as typeof fetch)
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    stop()
    const again = startAutoUpdate(reply('build-b') as unknown as typeof fetch)
    await new Promise(r => setTimeout(r, 10))
    expect(reload).toHaveBeenCalledTimes(1)
    again()
  })
  it('does nothing when already on the live build', async () => {
    const fetcher = reply('build-a')
    const stop = startAutoUpdate(fetcher as unknown as typeof fetch)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalled())
    await new Promise(r => setTimeout(r, 10))
    expect(reload).not.toHaveBeenCalled()
    stop()
  })
})
