export function compassBearing(event: { alpha: number | null; absolute: boolean; webkitCompassHeading?: number; webkitCompassAccuracy?: number }, screenAngle = 0): number | null {
  if (event.webkitCompassAccuracy != null && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 30)) return null
  const heading = Number.isFinite(event.webkitCompassHeading) ? event.webkitCompassHeading! :
    event.absolute && event.alpha != null && Number.isFinite(event.alpha) ? 360 - event.alpha : null
  return heading == null ? null : ((-heading - screenAngle) % 360 + 360) % 360
}
