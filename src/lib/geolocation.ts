import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type LocationErrorReason = 'permission_denied' | 'unavailable' | 'timeout' | 'unsupported'

export class LocationError extends Error {
  reason: LocationErrorReason
  constructor(reason: LocationErrorReason, message: string) {
    super(message)
    this.reason = reason
  }
}

/** Uses Capacitor's native geolocation (proper OS permission prompt) when running
 * as an installed app, falling back to the browser API when running as a website.
 * Distinguishes *why* it failed (denied vs unavailable vs timed out) so the UI can
 * give actionable guidance instead of one generic dead-end message. */
export async function getBrowserLocation(): Promise<{ coords: { latitude: number; longitude: number } }> {
  if (Capacitor.isNativePlatform()) {
    let status = await Geolocation.checkPermissions()
    if (status.location !== 'granted') {
      status = await Geolocation.requestPermissions()
    }
    if (status.location !== 'granted') {
      throw new LocationError('permission_denied', 'Location permission was denied.')
    }
    try {
      return await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
    } catch {
      throw new LocationError('unavailable', 'Could not determine your location.')
    }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new LocationError('unsupported', 'Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new LocationError('permission_denied', err.message))
        else if (err.code === err.TIMEOUT) reject(new LocationError('timeout', err.message))
        else reject(new LocationError('unavailable', err.message))
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })
}

/** Continuously tracks the device's position (e.g. while driving), unlike
 * getBrowserLocation's single one-off read. Returns a cleanup function that
 * stops the watch -- always call it when the caller unmounts, or the native
 * GPS radio stays on and drains battery for no reason. Silently does
 * nothing on error (a dropped GPS signal mid-drive shouldn't crash the map;
 * it just stops updating until signal returns). */
export function watchLocation(onUpdate: (pos: { latitude: number; longitude: number }) => void): () => void {
  if (Capacitor.isNativePlatform()) {
    let watchId: string | null = null
    let cancelled = false
    Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000 }, (pos, err) => {
      if (err || !pos) return
      onUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    }).then((id) => {
      if (cancelled) Geolocation.clearWatch({ id })
      else watchId = id
    })
    return () => {
      cancelled = true
      if (watchId) Geolocation.clearWatch({ id: watchId })
    }
  }

  if (!navigator.geolocation) return () => {}
  const watchId = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => {},
    { enableHighAccuracy: true, timeout: 10000 },
  )
  return () => navigator.geolocation.clearWatch(watchId)
}
