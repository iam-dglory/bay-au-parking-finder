import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import type { CarPark } from '../types'

/** Off-street car parks are a much smaller, separate dataset from on-street
 * bays (a few hundred citywide, not thousands), so no truncation/paging
 * concerns here the way useNearbyParking has. */
export function useNearbyCarParks(center: { lat: number; lng: number } | null, radiusM: number, enabled: boolean) {
  const [carParks, setCarParks] = useState<CarPark[]>([])

  const refresh = useCallback(async () => {
    if (!center || !enabled) {
      setCarParks([])
      return
    }
    const { data, error } = await supabase.rpc('nearby_car_parks', { p_lat: center.lat, p_lng: center.lng, p_radius_m: radiusM })
    if (error) return
    setCarParks((data ?? []) as CarPark[])
  }, [center?.lat, center?.lng, radiusM, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { carParks }
}
