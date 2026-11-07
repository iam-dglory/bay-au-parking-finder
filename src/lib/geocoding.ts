/** Turns a raw GPS fix into a readable label like "88 Spencer Street,
 * Melbourne" instead of showing the coordinates or a placeholder like "you".
 * Falls back gracefully (street only, then suburb only, then null) since not
 * every point resolves to a full street address. */
export async function reverseGeocodeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
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

export interface PlaceSearchResult {
  name: string
  address: string
  lat: number
  lng: number
}

/** Searches greater Melbourne for a named place — a shopping centre, venue,
 * landmark or exact address — so someone can check parking near where they're
 * going before they set off. */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  if (!query.trim()) return []
  try {
    const params = new URLSearchParams({ format: 'jsonv2', q: query, addressdetails: '1', limit: '8' })
    // Bay covers Melbourne only, so search inside greater Melbourne.
    params.set('countrycodes', 'au')
    params.set('viewbox', '144.3,-37.3,145.7,-38.5')
    params.set('bounded', '1')
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
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
