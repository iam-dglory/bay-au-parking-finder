import { useEffect, useState } from 'react'

/** Streets and car parks the driver starred. Kept on this device only. */
export interface FavouritePlace { id: string; name: string; lat: number; lng: number }

const KEY = 'bay.favourite-places.v1'
const listeners = new Set<(places: FavouritePlace[]) => void>()

const valid = (p: unknown): p is FavouritePlace => !!p && typeof p === 'object'
  && typeof (p as FavouritePlace).id === 'string' && typeof (p as FavouritePlace).name === 'string'
  && Number.isFinite((p as FavouritePlace).lat) && Number.isFinite((p as FavouritePlace).lng)

export function readFavourites(): FavouritePlace[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(valid).slice(0, 50) : []
  } catch { return [] }
}

/** Returns true when the place is now saved. */
export function toggleFavourite(place: FavouritePlace): boolean {
  const list = readFavourites()
  const on = !list.some(p => p.id === place.id)
  const next = on ? [{ id: place.id, name: place.name, lat: place.lat, lng: place.lng }, ...list] : list.filter(p => p.id !== place.id)
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  for (const l of listeners) l(next)
  return on
}

export function useFavourites(): FavouritePlace[] {
  const [list, setList] = useState(readFavourites)
  useEffect(() => { listeners.add(setList); return () => { listeners.delete(setList) } }, [])
  return list
}
