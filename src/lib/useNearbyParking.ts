import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { logSearchEvent } from './searchEvents'
import { loadNearbyPages } from './nearbyPages'
import type { ParkingSpot } from '../types'
import { catalogSpot } from './indiaParking'
import { regionalNearby, mergeMappedBays } from './regionalParking'
import { fetchMelbourneSensors, mergeMelbourneSensors, isMelbourneSearch } from './melbourneSensors'

export function useNearbyParking(center: { lat: number; lng: number } | null, radiusM: number) {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const sequence = useRef(0)
  const lat = center?.lat
  const lng = center?.lng
  const refresh = useCallback(async (recordSearch = false) => {
    if (lat == null || lng == null) return
    const request = ++sequence.current
    setLoading(true)
    setError(null)
    try {
      const remoteDeadline = AbortSignal.timeout(15000)
      const [remote, local, council] = await Promise.allSettled([loadNearbyPages<ParkingSpot>(async (offset) => {
        const { data, error: rpcError, count } = await supabase
          .rpc('nearby_parking', { p_lat: lat, p_lng: lng, p_radius_m: radiusM }, { count: 'exact' })
          .order('distance_m').order('id').range(offset, offset + 999).abortSignal(remoteDeadline)
        if (rpcError) throw rpcError
        return { rows: (data ?? []) as ParkingSpot[], total: count }
      }, () => sequence.current !== request), regionalNearby(lat,lng,radiusM), fetchMelbourneSensors(lat,lng,radiusM)])
      if (remote.status === 'rejected' && local.status === 'rejected' && council.status === 'rejected') throw remote.reason
      let rows = mergeMappedBays(remote.status === 'fulfilled' ? remote.value : [],local.status === 'fulfilled' ? local.value.filter(row=>row.kind==='bay').map(catalogSpot) : [])
      if (request !== sequence.current) return
      if (isMelbourneSearch(lat,lng)) {
        // Legacy coordinate matches from the database must not colour another bay.
        rows = rows.map(row => ({...row, sensor_status: row.sensor_status?.match_method === 'kerbside_id' ? row.sensor_status : null}))
        if (council.status === 'fulfilled') rows = mergeMelbourneSensors(rows, council.value, {lat,lng}, new Date().toISOString())
        else setError('Council availability could not refresh. Parking locations remain available; try Refresh.')
      }
      if (remote.status === 'rejected') setError('Council parking schedules could not refresh. Saved map locations remain available.')
      if (local.status === 'rejected') setError('Mapped parking locations could not load. Please refresh.')
      setSpots(rows)
      setUpdatedAt(new Date())
      if (recordSearch) logSearchEvent({ lat, lng }, radiusM, rows.length)
    } catch (err) {
      if (request === sequence.current) {
        console.error('Bay parking data request failed', err)
        const message = err instanceof TypeError || String((err as { message?: string })?.message ?? err).toLowerCase().includes('fetch')
          ? 'Parking data is temporarily unavailable. Check your connection and try again.'
          : (err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Could not refresh parking')
        setError(message)
      }
    } finally {
      if (request === sequence.current) setLoading(false)
    }
  }, [lat, lng, radiusM])
  useEffect(() => {
    setSpots([])
    setUpdatedAt(null)
    void refresh(true)
    const timer = setInterval(() => { if (!document.hidden) void refresh() }, 60000)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    // The latest request must be invalidated on teardown; reading the ref here is intentional.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return () => { sequence.current++; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])
  return { spots, loading, error, updatedAt, refresh: () => refresh(false) }
}
