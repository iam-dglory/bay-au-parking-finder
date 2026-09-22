import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { logSearchEvent } from './searchEvents'
import type { ParkingSpot } from '../types'

export function useNearbyParking(center: { lat: number; lng: number } | null, radiusM: number) {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const refresh = useCallback(async () => {
    if (!center) return
    setLoading(true)
    setError(null)
    const { data, error: rpcError, count } = await supabase
      .rpc(
        'nearby_parking',
        { p_lat: center.lat, p_lng: center.lng, p_radius_m: radiusM },
        { count: 'exact' },
      )
      .range(0, 2999)
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }
    const rows = (data ?? []) as ParkingSpot[]
    setSpots(rows)
    setTruncated(count != null && count > rows.length)
    setLoading(false)
    logSearchEvent(center, radiusM, rows.length)
  }, [center?.lat, center?.lng, radiusM])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { spots, loading, error, truncated, refresh }
}
