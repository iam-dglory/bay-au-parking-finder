import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface City {
  name: string
  lat: number
  lng: number
}

export const CITIES: City[] = [
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
]

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
