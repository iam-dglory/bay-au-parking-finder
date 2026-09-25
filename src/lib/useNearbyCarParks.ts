import { useEffect, useState, useCallback, useRef } from 'react'
import { indiaNearby } from './indiaParking'
import { supabase } from './supabaseClient'
import type { CarPark } from '../types'

/** Off-street car parks are a much smaller, separate dataset from on-street
 * bays (a few hundred citywide, not thousands), so no truncation/paging
 * concerns here the way useNearbyParking has. */
export function useNearbyCarParks(center: { lat: number; lng: number } | null, radiusM: number, enabled: boolean) {
  const [carParks, setCarParks] = useState<CarPark[]>([])
  const [error,setError] = useState<string | null>(null)
  const [loading,setLoading] = useState(false)
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
      supabase.rpc('nearby_car_parks',{p_lat:lat,p_lng:lng,p_radius_m:radiusM}),indiaNearby(lat,lng,radiusM),
    ])
    if(request!==sequence.current)return
    const rpcOk=remote.status==='fulfilled' && !remote.value.error
    setCarParks([...(rpcOk ? (remote.value.data ?? []) as CarPark[] : []),...(local.status==='fulfilled' ? local.value.filter(r=>r.kind==='area') : [])].sort((a,b)=>a.distance_m-b.distance_m))
    if(!rpcOk || local.status==='rejected')setError('Some parking area sources could not load. Refresh to try again.')
    setLoading(false)
  }, [lat, lng, radiusM, enabled])

  useEffect(() => {
    refresh()
    // Invalidates an in-flight result after location/radius changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return()=>{sequence.current++}
  }, [refresh])

  return { carParks, error, loading, refresh }
}
