import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import type { Listing } from '../types'

export function useNearbyListings(center: { lat: number; lng: number } | null, radiusM: number) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!center) return
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('nearby_listings', {
      p_lat: center.lat,
      p_lng: center.lng,
      p_radius_m: radiusM,
    })
    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }
    setListings((data ?? []) as Listing[])
    setLoading(false)
  }, [center?.lat, center?.lng, radiusM])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { listings, loading, error, refresh }
}
