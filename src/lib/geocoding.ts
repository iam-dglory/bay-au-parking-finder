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

export interface CitySearchResult {
  name: string
  stateName: string
  lat: number
  lng: number
}

/** Live city/suburb search scoped to a country (ISO 3166-1 alpha-2 code), via
 * Nominatim. Used instead of bundling a full worldwide city dataset, which
 * would add several megabytes to the app for data that goes stale anyway. */
export async function searchCities(query: string, countryCode: string): Promise<CitySearchResult[]> {
  if (!query.trim()) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&countrycodes=${countryCode.toLowerCase()}&addressdetails=1&limit=8`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    return (data ?? [])
      .filter((r: any) => r.lat && r.lon)
      .map((r: any) => ({
        name: r.address?.city || r.address?.town || r.address?.village || r.address?.suburb || r.display_name.split(',')[0],
        stateName: r.address?.state || r.address?.state_district || '',
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))
  } catch {
    return []
  }
}
