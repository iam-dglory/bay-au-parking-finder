import { useEffect, useState } from 'react'
import { Clock3, CircleCheck, Image, MessageSquarePlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { evaluateSpotStatus } from '../lib/parkingStatus'
import type { ParkingSpot, SpotStatus, SpotVisit } from '../types'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const MODERATION_BADGE = {
  pending: { icon: Clock3, text: 'Pending review', className: 'bg-amber-100 text-amber-700' },
  approved: { icon: CircleCheck, text: 'Published on the map', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { icon: Image, text: 'Update the photo to match the sign', className: 'bg-amber-100 text-amber-700' },
} as const

export function MyActivity({ center, onOpenFeedback }: { center: { lat: number; lng: number }; onOpenFeedback: () => void }) {
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
        .select('id, address_text, suburb, state, country, lat, lng, created_by, photo_url, moderation_status, kerbside_id, parking_rules(*)')
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
          photo_url: row.photo_url,
          moderation_status: row.moderation_status,
          kerbside_id: row.kerbside_id ?? null,
          rules: row.parking_rules ?? [],
          latest_ping: null,
          sensor_status: null,
        }
        return { ...spot, status: evaluateSpotStatus(spot.rules, spot.lat, spot.lng) }
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
    <div className="h-full overflow-y-auto bg-[#f6f8fc]">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">Your Bay history</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">My activity</h1>
        <p className="mt-1 text-sm text-slate-300">Your saved directions and contributed signs</p>
      </div>

      <section className="m-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Parking history</h2>
        <p className="mb-2 -mt-1 text-xs text-slate-400">Places you've gotten directions to</p>
        {visits.length === 0 && <p className="text-sm text-slate-400">Nowhere yet. Get directions to a spot and it'll show up here.</p>}
        <div className="space-y-1.5">
          {visits.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-800">{v.address_text}</p>
                {v.country && <p className="text-xs text-slate-400">{v.country}</p>}
              </div>
              <span className="text-xs text-slate-400">{formatWhen(v.visited_at)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Signs I've reported</h2>
        {signs.length === 0 && <p className="text-sm text-slate-400">No signs reported yet.</p>}
        <div className="space-y-2">
          {signs.map((spot) => {
            const badge = MODERATION_BADGE[spot.moderation_status]
            const Icon = badge.icon
            return (
              <div key={spot.id} className="space-y-1">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                  <Icon className="h-3 w-3" strokeWidth={2} /> {badge.text}
                </span>
                <SpotCard spot={spot} onClick={() => setSelectedSign(spot)} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={onOpenFeedback}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
          Send feedback about the app
        </button>
      </section>

      <SpotDetailSheet spot={selectedSign} onClose={() => setSelectedSign(null)} />
    </div>
  )
}
