import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { evaluateSpotStatus } from '../lib/parkingStatus'
import type { ParkingSpot, SpotStatus } from '../types'

export function MySpots({ center }: { center: { lat: number; lng: number } }) {
  const [spots, setSpots] = useState<(ParkingSpot & { status: SpotStatus })[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        setSpots([])
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('parking_spots')
        .select('id, address_text, suburb, state, lat, lng, created_by, parking_rules(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      const mapped = (data ?? []).map((row: any) => {
        const spot: ParkingSpot = {
          id: row.id,
          address_text: row.address_text,
          suburb: row.suburb,
          state: row.state,
          lat: row.lat,
          lng: row.lng,
          distance_m: 0,
          created_by: row.created_by,
          rules: row.parking_rules ?? [],
        }
        return { ...spot, status: evaluateSpotStatus(spot.rules) }
      })
      setSpots(mapped)
      setLoading(false)
    }
    load()
  }, [center.lat, center.lng])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-base font-semibold text-slate-900">My reported spots</h1>
        <p className="text-xs text-slate-500">Signs you've added on this device</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading && <p className="text-center text-sm text-slate-400">Loading…</p>}
        {!loading && spots.length === 0 && (
          <p className="text-center text-sm text-slate-400">You haven't reported any parking signs yet. Tap "Add" to contribute one.</p>
        )}
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} onClick={() => setSelected(spot)} />
        ))}
      </div>
      <SpotDetailSheet spot={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
