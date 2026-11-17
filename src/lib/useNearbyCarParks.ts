import { useEffect, useState, useCallback, useRef } from 'react'
import { regionalNearby, mergeParkingAreas } from './regionalParking'
import { supabase } from './supabaseClient'
import type { CarPark } from '../types'
import { isMelbourneSearch } from './melbourneSensors'
import { metresBetween, readOffline, saveOffline } from './offlineStore'

/** Keep census/operator areas separate from individual bays. The regional
 * layer fetches geographic tiles; Home pages the combined display. */
export function useNearbyCarParks(center: { lat: number; lng: number } | null, radiusM: number, enabled: boolean) {
  const [carParks, setCarParks] = useState<CarPark[]>([])
  const [error,setError] = useState<string | null>(null)
  const [loading,setLoading] = useState(false)
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
  const sequence=useRef(0)

  const lat = center?.lat
  const lng = center?.lng
  const refresh = useCallback(async () => {
    const request=++sequence.current
    setCarParks([]);setError(null)
    if (lat == null || lng == null || !enabled) {
      setCarParks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [remote,local]=await Promise.allSettled([
      !isMelbourneSearch(lat, lng) ? Promise.resolve({data: [] as CarPark[], error: null}) : supabase.rpc('nearby_car_parks',{p_lat:lat,p_lng:lng,p_radius_m:radiusM}).abortSignal(AbortSignal.timeout(15000)),regionalNearby(lat,lng,radiusM),
    ])
    if(request!==sequence.current)return
    const rpcOk=remote.status==='fulfilled' && !remote.value.error
    const rows = mergeParkingAreas(
      rpcOk ? (remote.value.data ?? []) as CarPark[] : [],
      local.status==='fulfilled' ? local.value : [],
    )
    if (rows.length === 0 && !rpcOk && local.status === 'rejected') {
      // No signal: fall back to the copy saved near here in the last day.
      const copy = await readOffline<{ lat: number; lng: number; rows: CarPark[] }>('nearby-car-parks')
      if (request !== sequence.current) return
      if (copy && Date.now() - Date.parse(copy.savedAt) < 24 * 3600_000 && metresBetween(copy.data, { lat, lng }) < 1500) {
        setCarParks(copy.data.rows); setOfflineSince(new Date(copy.savedAt)); setLoading(false); return
      }
    }
    setCarParks(rows)
    setOfflineSince(null)
    if (rows.length > 0) void saveOffline('nearby-car-parks', { lat, lng, rows })
    // Regional catalogs and the legacy database are independent fallbacks. A
    // failed optional request must never mark an already usable map as broken.
    setError(rows.length === 0 && !rpcOk && local.status === 'rejected' ? 'Parking areas are unavailable right now.' : null)
    setLoading(false)
  }, [lat, lng, radiusM, enabled])

  useEffect(() => {
    refresh()
    // Invalidates an in-flight result after location/radius changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return()=>{sequence.current++}
  }, [refresh])

  return { carParks, error, loading, offlineSince, refresh }
}
