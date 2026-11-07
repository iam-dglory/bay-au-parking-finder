import { useEffect, useState } from 'react'

export type NavApp = 'google' | 'apple' | 'waze'
export const NAV_APP_LABEL: Record<NavApp, string> = { google: 'Google Maps', apple: 'Apple Maps', waze: 'Waze' }

const KEY = 'bay.nav-app.v1'
const listeners = new Set<(app: NavApp) => void>()

type Platform = 'android' | 'ios' | 'web'
function platform(): Platform {
  if (typeof navigator === 'undefined') return 'web'
  if (/Android/i.test(navigator.userAgent)) return 'android'
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios'
  return 'web'
}

/** The driver's chosen navigation app, else the phone's own. */
export function navApp(): NavApp {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'google' || v === 'apple' || v === 'waze') return v
  } catch { /* storage unavailable */ }
  return platform() === 'ios' ? 'apple' : 'google'
}

export function setNavApp(app: NavApp) {
  try { localStorage.setItem(KEY, app) } catch { /* storage unavailable */ }
  for (const l of listeners) l(app)
}

export function useNavApp(): NavApp {
  const [app, setApp] = useState(navApp)
  useEffect(() => { listeners.add(setApp); return () => { listeners.delete(setApp) } }, [])
  return app
}

/** Turn-by-turn driving directions in the chosen app. On Android, Google Maps
 * opens straight into navigation. */
export function navigationUrl(lat: number, lng: number, app: NavApp = navApp(), on: Platform = platform()): string {
  const ll = `${lat},${lng}`
  if (app === 'waze') return `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`
  if (app === 'apple') return on === 'ios' ? `maps://?daddr=${encodeURIComponent(ll)}&dirflg=d` : `https://maps.apple.com/?daddr=${encodeURIComponent(ll)}&dirflg=d`
  if (on === 'android') return `google.navigation:q=${encodeURIComponent(ll)}&mode=d`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ll)}&travelmode=driving`
}
