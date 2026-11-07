import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFavourites, toggleFavourite } from './favourites'

const store = new Map<string, string>()
afterEach(() => { store.clear(); vi.unstubAllGlobals() })
const queen = { id: 'street:Queen St', name: 'Queen St', lat: -37.81, lng: 144.96 }

describe('favourites', () => {
  it('adds and removes a place, ignoring bad data', () => {
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v) } })
    expect(toggleFavourite(queen)).toBe(true)
    expect(readFavourites()).toEqual([queen])
    expect(toggleFavourite(queen)).toBe(false)
    expect(readFavourites()).toEqual([])
    store.set('bay.favourite-places.v1', '[{"id":1}]')
    expect(readFavourites()).toEqual([])
  })
})
