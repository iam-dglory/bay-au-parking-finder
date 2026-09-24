import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import type { CarPark } from '../types'

/** Off-street car parks are a much smaller, separate dataset from on-street
 * bays (a few hundred citywide, not thousands), so no truncation/paging
 * concerns here the way useNearbyParking has. */
export function useNearbyCarParks(center: { lat: number; lng: number } | null, radiusM: number, enabled: boolean) {
  const [carParks, setCarParks] = useState<CarPark[]>([])

  const lat = center?.lat
  const lng = center?.lng
  const refresh = useCallback(async () => {
    if (lat == null || lng == null || !enabled) {
      setCarParks([])
      return
    }
    const { data, error } = await supabase.rpc('nearby_car_parks', { p_lat: lat, p_lng: lng, p_radius_m: radiusM })
    if (error) return
    setCarParks((data ?? []) as CarPark[])
  }, [lat, lng, radiusM, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { carParks }
}
