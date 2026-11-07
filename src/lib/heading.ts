import { useEffect, useState } from 'react'

/** Where the driver tapped Go, so Bay can offer "Parked? Start timer" on arrival. */
export interface Heading {
  id: string
  name: string
  kind: 'street' | 'carpark'
  lat: number
  lng: number
  navLat: number
  navLng: number
  cents: number | null
  durationMinutes: number
  limitMinutes: number | null
  setAt: number
}

const KEY = 'bay.heading.v1'
const MAX_AGE = 3 * 3_600_000
const listeners = new Set<(h: Heading | null) => void>()

export function readHeading(now = Date.now()): Heading | null {
  try {
    const h = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Heading | null
    return h && typeof h.id === 'string' && Number.isFinite(h.lat) && now - h.setAt < MAX_AGE ? h : null
  } catch { return null }
}

export function setHeading(h: Heading | null) {
  try { if (h) localStorage.setItem(KEY, JSON.stringify(h)); else localStorage.removeItem(KEY) } catch { /* ignore */ }
  for (const l of listeners) l(h)
}

export function useHeading() {
  const [h, setH] = useState(() => readHeading())
  useEffect(() => { listeners.add(setH); return () => { listeners.delete(setH) } }, [])
  return h
}
