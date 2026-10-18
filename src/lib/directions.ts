export type NavigationPlatform = 'android' | 'ios' | 'web'

/**
 * Prefer the phone's navigation app over a browser redirect. The fallback is
 * still a standards-based Google Maps URL for a desktop browser or a device
 * without a recognised native platform. Facility names and imported text
 * directions are deliberately not used: Bay's displayed pin and destination
 * must always be the exact same coordinate.
 */
export function directionsUrl(lat: number, lng: number, platform = currentPlatform()): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  const destination = `${lat},${lng}`
  if (platform === 'android') return `google.navigation:q=${encodeURIComponent(destination)}&mode=d`
  if (platform === 'ios') return `maps://?daddr=${encodeURIComponent(destination)}&dirflg=d`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=driving`
}

function currentPlatform(): NavigationPlatform {
  if (typeof navigator === 'undefined') return 'web'
  const agent = navigator.userAgent
  if (/Android/i.test(agent)) return 'android'
  if (/iPhone|iPad|iPod/i.test(agent)) return 'ios'
  return 'web'
}
