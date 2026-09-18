/** Best-effort country detection from a dropped pin, via OpenStreetMap's free
 * Nominatim API (same data source as our map tiles, no key required). Never
 * throws — callers should treat `null` as "ask the user instead". */
export async function detectCountry(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    return data?.address?.country ?? null
  } catch {
    return null
  }
}
