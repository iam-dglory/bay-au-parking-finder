/** A small on-phone copy of the last good data, so Bay still answers in an
 * underground car park or a dead spot. Uses Cache Storage where the browser or
 * app WebView offers it (room for megabytes), otherwise localStorage. Every
 * call fails quietly: offline copies are a bonus, never a reason to break. */
const CACHE_NAME = 'bay-offline-v1'
const keyUrl = (key: string) => `https://offline.bay.invalid/${encodeURIComponent(key)}`

type Stored<T> = { savedAt: string; data: T }

function cacheStorage(): CacheStorage | null {
  try { return typeof caches !== 'undefined' ? caches : null } catch { return null }
}

export async function saveOffline<T>(key: string, data: T): Promise<void> {
  const body = JSON.stringify({ savedAt: new Date().toISOString(), data } satisfies Stored<T>)
  try {
    const store = cacheStorage()
    if (store) { await (await store.open(CACHE_NAME)).put(keyUrl(key), new Response(body, { headers: { 'content-type': 'application/json' } })); return }
    if (body.length < 1_500_000) localStorage.setItem(`bay.offline.${key}`, body)
  } catch { /* storage full or blocked */ }
}

export async function readOffline<T>(key: string): Promise<Stored<T> | null> {
  try {
    const store = cacheStorage()
    if (store) {
      const hit = await (await store.open(CACHE_NAME)).match(keyUrl(key))
      return hit ? await hit.json() as Stored<T> : null
    }
    const raw = localStorage.getItem(`bay.offline.${key}`)
    return raw ? JSON.parse(raw) as Stored<T> : null
  } catch { return null }
}

/** Network first; on failure, the last saved copy. */
export async function withOfflineCopy<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const data = await load()
    void saveOffline(key, data)
    return data
  } catch (error) {
    const copy = await readOffline<T>(key)
    if (copy) return copy.data
    throw error
  }
}

/** Metres between two points (good enough for "is this the same area?"). */
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dy = (a.lat - b.lat) * 111_320
  const dx = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}
