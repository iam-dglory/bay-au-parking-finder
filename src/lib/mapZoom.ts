export function zoomForRadius(radiusM: number): number {
  return radiusM <= 500 ? 16 : radiusM <= 1000 ? 15 : radiusM <= 2000 ? 14 : 13
}

/**
 * A driver can freely zoom the map out to explore a surrounding suburb. Keep
 * the requested map data in step with that view instead of leaving an empty
 * map outside the last radius chip. The chips still describe the closest
 * search; this is only the extra data needed to make zooming useful.
 */
export function coverageRadiusForZoom(zoom: number): number {
  if (zoom <= 11) return 20_000
  if (zoom <= 12) return 10_000
  if (zoom <= 13) return 5_000
  if (zoom <= 14) return 2_000
  if (zoom <= 15) return 1_000
  return 500
}
