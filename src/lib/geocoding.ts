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

/** Turns a raw GPS fix into a readable label like "88 Spencer Street,
 * Melbourne" instead of showing the coordinates or a placeholder like "you".
 * Falls back gracefully (street only, then suburb only, then null) since not
 * every point resolves to a full street address. */
export async function reverseGeocodeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const a = data?.address
    if (!a) return null
    const street = [a.house_number, a.road].filter(Boolean).join(' ')
    const place = a.suburb || a.city || a.town || a.village || a.county
    if (street && place) return `${street}, ${place}`
    return street || place || null
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

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

/** Live city/suburb search scoped to a country (ISO 3166-1 alpha-2 code) and,
 * when given, a state/region name — via Nominatim. Used instead of bundling a
 * full worldwide city dataset, which would add several megabytes to the app
 * for data that goes stale anyway.
 *
 * Nominatim doesn't let free-text `q` be combined with a structured `state`
 * filter, so the state name is folded into the query text instead (which also
 * improves its own text-matching/ranking), and results are then strictly
 * filtered to that state — otherwise, picking "New South Wales" and typing a
 * Victorian suburb would still surface Victorian results. */
export async function searchCities(query: string, countryCode: string, stateName?: string): Promise<CitySearchResult[]> {
  if (!query.trim()) return []
  try {
    const q = stateName ? `${query}, ${stateName}` : query
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=${countryCode.toLowerCase()}&addressdetails=1&limit=10`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    const results: CitySearchResult[] = (data ?? [])
      .filter((r: any) => r.lat && r.lon)
      .map((r: any) => ({
        name: r.address?.city || r.address?.town || r.address?.village || r.address?.suburb || r.display_name.split(',')[0],
        stateName: r.address?.state || r.address?.state_district || '',
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))

    // Appending the state name can make Nominatim's fuzzy matching latch onto
    // an unrelated place that matches the state strongly (e.g. the capital)
    // when nothing actually matches the typed name — so also require the
    // result's own name to resemble what was actually typed.
    const typed = normalize(query)
    const nameMatches = (r: CitySearchResult) => {
      const n = normalize(r.name)
      return n.includes(typed) || typed.includes(n)
    }

    const wanted = stateName ? normalize(stateName) : null
    const stateMatches = (r: CitySearchResult) => !wanted || (!!r.stateName && (normalize(r.stateName).includes(wanted) || wanted.includes(normalize(r.stateName))))

    return results.filter((r) => nameMatches(r) && stateMatches(r)).slice(0, 8)
  } catch {
    return []
  }
}

export interface PlaceSearchResult {
  name: string
  address: string
  lat: number
  lng: number
}

/** Searches for a named place — a shopping centre, restaurant, landmark, exact
 * address, anything — rather than a city/suburb, so someone can check parking
 * near their destination before they set off. Softly biased toward `near`
 * (typically the user's current search centre) without excluding real matches
 * elsewhere, in case they're planning a trip somewhere else entirely. */
export async function searchPlaces(query: string, near?: { lat: number; lng: number }): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return []
  try {
    const params = new URLSearchParams({ format: 'jsonv2', q: query, addressdetails: '1', limit: '8' })
    if (near) {
      const delta = 0.5 // ~50km soft bias box around the current area
      params.set('viewbox', `${near.lng - delta},${near.lat + delta},${near.lng + delta},${near.lat - delta}`)
      params.set('bounded', '0')
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    return (data ?? [])
      .filter((r: any) => r.lat && r.lon && r.display_name)
      .map((r: any) => {
        const parts = String(r.display_name).split(',').map((p: string) => p.trim())
        return {
          name: parts[0],
          address: parts.slice(1, 4).join(', '),
          lat: Number(r.lat),
          lng: Number(r.lon),
        }
      })
  } catch {
    return []
  }
}
