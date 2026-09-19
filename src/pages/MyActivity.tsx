import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { evaluateSpotStatus } from '../lib/parkingStatus'
import type { ParkingSpot, SpotStatus, SpotVisit } from '../types'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function MyActivity({ center }: { center: { lat: number; lng: number } }) {
  const [visits, setVisits] = useState<SpotVisit[]>([])
  const [signs, setSigns] = useState<(ParkingSpot & { status: SpotStatus })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSign, setSelectedSign] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setLoading(false)
      return
    }

    const [visitsRes, signsRes] = await Promise.all([
      supabase.from('spot_visits').select('*').eq('user_id', userId).order('visited_at', { ascending: false }).limit(20),
      supabase
        .from('parking_spots')
        .select('id, address_text, suburb, state, country, lat, lng, created_by, parking_rules(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false }),
    ])

    setVisits((visitsRes.data ?? []) as SpotVisit[])
    setSigns(
      (signsRes.data ?? []).map((row: any) => {
        const spot: ParkingSpot = {
          id: row.id,
          address_text: row.address_text,
          suburb: row.suburb,
          state: row.state,
          country: row.country,
          lat: row.lat,
          lng: row.lng,
          distance_m: 0,
          created_by: row.created_by,
          rules: row.parking_rules ?? [],
          latest_ping: null,
        }
        return { ...spot, status: evaluateSpotStatus(spot.rules) }
      }),
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [center.lat, center.lng])

  if (loading) {
    return <p className="p-4 text-center text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-base font-semibold text-slate-900">My activity</h1>
        <p className="text-xs text-slate-500">Where you've parked and what you've reported</p>
      </div>

      <section className="p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Parking history</h2>
        <p className="mb-2 -mt-1 text-xs text-slate-400">Places you've gotten directions to</p>
        {visits.length === 0 && <p className="text-sm text-slate-400">Nowhere yet — get directions to a spot and it'll show up here.</p>}
        <div className="space-y-1.5">
          {visits.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{v.address_text}</p>
                {v.country && <p className="text-xs text-slate-400">{v.country}</p>}
              </div>
              <span className="text-xs text-slate-400">{formatWhen(v.visited_at)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Signs I've reported</h2>
        {signs.length === 0 && <p className="text-sm text-slate-400">No signs reported yet.</p>}
        <div className="space-y-2">
          {signs.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onClick={() => setSelectedSign(spot)} />
          ))}
        </div>
      </section>

      <SpotDetailSheet spot={selectedSign} onClose={() => setSelectedSign(null)} />
    </div>
  )
}
