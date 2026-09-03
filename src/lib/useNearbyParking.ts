import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import type { ParkingSpot } from '../types'

export function useNearbyParking(center: { lat: number; lng: number } | null, radiusM: number) {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!center) return
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('nearby_parking', {
      p_lat: center.lat,
      p_lng: center.lng,
      p_radius_m: radiusM,
    })
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }
    setSpots((data ?? []) as ParkingSpot[])
    setLoading(false)
  }, [center?.lat, center?.lng, radiusM])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { spots, loading, error, refresh }
}
