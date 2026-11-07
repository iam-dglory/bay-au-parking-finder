import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadSavedLocations, rememberLocation, savedStartupLocation } from './savedLocations'

const store = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value) },
}

afterEach(() => { store.clear(); vi.unstubAllGlobals() })

const cbd = { lat: -37.8136, lng: 144.9631, label: 'Melbourne CBD', country: 'Australia' }
const fitzroy = { lat: -37.7984, lng: 144.9783, label: 'Fitzroy', country: 'Australia' }

describe('saved locations', () => {
  it('persists the last place without making it home', () => {
    vi.stubGlobal('window', { localStorage })
    expect(rememberLocation(cbd)).toEqual({ version: 1, last: cbd })
    expect(savedStartupLocation()).toEqual(cbd)
  })

  it('saves home and work only when asked, and ignores malformed data', () => {
    vi.stubGlobal('window', { localStorage })
    rememberLocation(cbd, 'home')
    expect(rememberLocation(fitzroy, 'work')).toMatchObject({ home: cbd, work: fitzroy, last: fitzroy })
    store.set('bay.saved-locations.v1', '{bad json')
    expect(loadSavedLocations()).toEqual({ version: 1 })
  })
})
