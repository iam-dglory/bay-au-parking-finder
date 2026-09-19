import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

/** Uses Capacitor's native geolocation (proper OS permission prompt) when running
 * as an installed app, falling back to the browser API when running as a website. */
export async function getBrowserLocation(): Promise<{ coords: { latitude: number; longitude: number } }> {
  if (Capacitor.isNativePlatform()) {
    return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
    })
  })
}
