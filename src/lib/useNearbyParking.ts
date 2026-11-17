import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { logSearchEvent } from './searchEvents'
import { loadNearbyPages } from './nearbyPages'
import type { ParkingSpot } from '../types'
import { catalogSpot, regionalNearby, mergeMappedBays } from './regionalParking'
import { fetchMelbourneSensors, mergeMelbourneSensors, isMelbourneSearch } from './melbourneSensors'
import { applyBayZoneRules, loadBayZoneRules } from './melbourneZoneRules'
import { metresBetween, readOffline, saveOffline } from './offlineStore'

/** An offline copy is used only near where it was saved, and only for a day. */
const OFFLINE_KEY = 'nearby-spots'
const OFFLINE_RADIUS_M = 1500
const OFFLINE_MAX_AGE_MS = 24 * 3600_000
type SpotsSnapshot = { lat: number; lng: number; rows: ParkingSpot[] }

export function useNearbyParking(center: { lat: number; lng: number } | null, radiusM: number) {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  /** Set when showing the saved copy because the network failed. */
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)
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
      // Bay covers Melbourne only: council bays, rules and sensors live in Supabase.
      if (!isMelbourneSearch(lat, lng)) { setSpots([]); setUpdatedAt(new Date()); return }
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
      {
        // Legacy coordinate matches from the database must not colour another bay.
        rows = rows.map(row => ({...row, sensor_status: row.sensor_status?.match_method === 'kerbside_id' ? row.sensor_status : null}))
        if (council.status === 'fulfilled') rows = mergeMelbourneSensors(rows, council.value, {lat,lng}, new Date().toISOString())
        // Each bay gets its own council zone's sign plates, not the whole road segment's.
        // If the file is unavailable, bays keep the safe "read the sign" status.
        const zoneRules = await loadBayZoneRules().catch(() => null)
        if (request !== sequence.current) return
        if (zoneRules) rows = applyBayZoneRules(rows, zoneRules)
      }
      // Each source is independently useful. Do not turn a partial refresh
      // failure into a broken-map warning while verified rows are available.
      setError(rows.length === 0 && remote.status === 'rejected' && local.status === 'rejected'
        ? 'Parking data is unavailable right now.'
        : null)
      setSpots(rows)
      setUpdatedAt(new Date())
      setOfflineSince(null)
      if (rows.length > 0) void saveOffline<SpotsSnapshot>(OFFLINE_KEY, { lat, lng, rows })
      if (recordSearch) logSearchEvent({ lat, lng }, radiusM, rows.length)
    } catch (err) {
      if (request === sequence.current) {
        console.error('Bay parking data request failed', err)
        const copy = await readOffline<SpotsSnapshot>(OFFLINE_KEY)
        if (request !== sequence.current) return
        if (copy && Date.now() - Date.parse(copy.savedAt) < OFFLINE_MAX_AGE_MS && metresBetween(copy.data, { lat, lng }) < OFFLINE_RADIUS_M) {
          // Free-bay counts from hours ago would mislead, so the saved copy has none.
          setSpots(copy.data.rows.map(row => ({ ...row, sensor_status: null })))
          setOfflineSince(new Date(copy.savedAt))
          setError(null)
          return
        }
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
  return { spots, loading, error, updatedAt, offlineSince, refresh: () => refresh(false) }
}
