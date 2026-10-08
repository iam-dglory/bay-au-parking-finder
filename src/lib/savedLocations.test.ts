import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadSavedLocations, rememberLocation, savedStartupLocation } from './savedLocations'

const store = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value) },
}

afterEach(() => { store.clear(); vi.unstubAllGlobals() })

describe('saved locations', () => {
  it('uses the first selected place as home and persists the last search', () => {
    vi.stubGlobal('window', { localStorage })
    const chennai = { lat: 13.0827, lng: 80.2707, label: 'Chennai, Tamil Nadu', country: 'India' }
    expect(rememberLocation(chennai)).toMatchObject({ home: chennai, last: chennai })
    expect(savedStartupLocation()).toEqual(chennai)
  })

  it('keeps a distinct work place and does not trust malformed saved data', () => {
    vi.stubGlobal('window', { localStorage })
    const home = { lat: 13.0827, lng: 80.2707, label: 'Chennai', country: 'India' }
    const work = { lat: 12.9716, lng: 77.5946, label: 'Bengaluru', country: 'India' }
    rememberLocation(home)
    expect(rememberLocation(work, 'work')).toMatchObject({ home, work, last: work })
    store.set('bay.saved-locations.v1', '{bad json')
    expect(loadSavedLocations()).toEqual({ version: 1 })
  })
})
