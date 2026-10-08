/** Build a driving URL from the map coordinate itself.  Facility names and
 * imported text directions are deliberately not used: they can be ambiguous
 * or stale, while Bay's displayed marker and the destination stay identical. */
export function directionsUrl(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`
}
