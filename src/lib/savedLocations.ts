export type SavedPlaceKind = 'home' | 'work'

export type SavedLocation = {
  lat: number
  lng: number
  label: string
  country?: string
}

export type SavedLocations = {
  version: 1
  home?: SavedLocation
  work?: SavedLocation
  last?: SavedLocation
}

const KEY = 'bay.saved-locations.v1'

function validLocation(value: unknown): value is SavedLocation {
  if (!value || typeof value !== 'object') return false
  const location = value as Partial<SavedLocation>
  return Number.isFinite(location.lat) && Number.isFinite(location.lng) &&
    Math.abs(location.lat!) <= 90 && Math.abs(location.lng!) <= 180 &&
    typeof location.label === 'string' && location.label.trim().length > 0 &&
    (location.country == null || typeof location.country === 'string')
}

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadSavedLocations(): SavedLocations {
  const storage = safeStorage()
  if (!storage) return { version: 1 }
  try {
    const raw = JSON.parse(storage.getItem(KEY) ?? 'null') as Partial<SavedLocations> | null
    if (!raw || raw.version !== 1) return { version: 1 }
    return {
      version: 1,
      ...(validLocation(raw.home) ? { home: raw.home } : {}),
      ...(validLocation(raw.work) ? { work: raw.work } : {}),
      ...(validLocation(raw.last) ? { last: raw.last } : {}),
    }
  } catch {
    return { version: 1 }
  }
}

function write(saved: SavedLocations) {
  try {
    safeStorage()?.setItem(KEY, JSON.stringify(saved))
  } catch {
    // A full or unavailable browser store must not stop parking search.
  }
}

/** Keeps the most recent search, and makes the first chosen place the home
 * default. The app therefore never falls back to a different country merely
 * because GPS is slow or has been denied on a later launch. */
export function rememberLocation(location: SavedLocation, saveAs?: SavedPlaceKind): SavedLocations {
  const previous = loadSavedLocations()
  const next: SavedLocations = {
    ...previous,
    last: location,
    ...(saveAs ? { [saveAs]: location } : {}),
    ...(!previous.home ? { home: location } : {}),
  }
  write(next)
  return next
}

export function savedStartupLocation(saved = loadSavedLocations()): SavedLocation | null {
  return saved.last ?? saved.home ?? null
}
