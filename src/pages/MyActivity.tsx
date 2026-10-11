import { useEffect, useState } from 'react'
import { Bookmark, BriefcaseBusiness, CalendarCheck2, ChevronRight, CircleCheck, Clock3, FileText, Headphones, Home, Image, MapPin, MessageSquarePlus } from 'lucide-react'
import type { SavedLocations } from '../lib/savedLocations'
import { supabase } from '../lib/supabaseClient'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { evaluateSpotStatus } from '../lib/parkingStatus'
import { BrandMark } from '../components/BrandMark'
import type { ParkingSpot, SpotStatus, SpotVisit } from '../types'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const MODERATION_BADGE = {
  pending: { icon: Clock3, text: 'Pending review', className: 'bg-amber-100 text-amber-700' },
  approved: { icon: CircleCheck, text: 'Published on the map', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { icon: Image, text: 'Update the photo to match the sign', className: 'bg-amber-100 text-amber-700' },
} as const

export function MyActivity({ center, savedLocations, onOpenFeedback, onAddSign }: { center: { lat: number; lng: number }; savedLocations: SavedLocations; onOpenFeedback: () => void; onAddSign: () => void }) {
  const [visits, setVisits] = useState<SpotVisit[]>([])
  const [signs, setSigns] = useState<(ParkingSpot & { status: SpotStatus })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSign, setSelectedSign] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) { setLoading(false); return }
    const [visitsRes, signsRes] = await Promise.all([
      supabase.from('spot_visits').select('*').eq('user_id', userId).order('visited_at', { ascending: false }).limit(20),
      supabase.from('parking_spots').select('id, address_text, suburb, state, country, lat, lng, created_by, photo_url, moderation_status, kerbside_id, parking_rules(*)').eq('created_by', userId).order('created_at', { ascending: false }),
    ])
    setVisits((visitsRes.data ?? []) as SpotVisit[])
    setSigns((signsRes.data ?? []).map((row: any) => {
      const spot: ParkingSpot = { id: row.id, address_text: row.address_text, suburb: row.suburb, state: row.state, country: row.country, lat: row.lat, lng: row.lng, distance_m: 0, created_by: row.created_by, photo_url: row.photo_url, moderation_status: row.moderation_status, kerbside_id: row.kerbside_id ?? null, rules: row.parking_rules ?? [], latest_ping: null, sensor_status: null }
      return { ...spot, status: evaluateSpotStatus(spot.rules, spot.lat, spot.lng) }
    }))
    setLoading(false)
  }

  useEffect(() => { void load() }, [center.lat, center.lng])

  return <main className="h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]">
    <header className="relative overflow-hidden px-5 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute -right-16 top-5 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="relative"><BrandMark className="w-[94px]" /><p className="mt-8 text-[11px] font-bold uppercase tracking-[.18em] text-[#1769ff]">Your Bay</p><h1 className="mt-2 text-4xl font-bold tracking-[-.055em]">My activity</h1><p className="mt-2 max-w-sm text-base leading-6 text-[#64748b]">Your saved places, parking history and signs you’ve contributed.</p></div>
    </header>

    <div className="space-y-4 px-4">
      <SectionCard icon={<Bookmark className="h-5 w-5" />} title="Saved places" detail="Locations you’ve saved for quick access.">
        {savedLocations.home || savedLocations.work ? <div className="mt-4 space-y-2">{savedLocations.home && <SavedPlace icon={<Home className="h-5 w-5" />} label="Home" value={savedLocations.home.label} />}{savedLocations.work && <SavedPlace icon={<BriefcaseBusiness className="h-5 w-5" />} label="Work" value={savedLocations.work.label} />}</div> : <EmptyText>No saved places yet. Save home or work from the map bookmark.</EmptyText>}
      </SectionCard>

      <SectionCard icon={<CalendarCheck2 className="h-5 w-5" />} title="My bookings" detail="Confirmed parking reservations will appear here.">
        <div className="mt-4 rounded-2xl bg-[#f7faff] px-4 py-4"><p className="font-semibold">No verified Bay bookings yet</p><p className="mt-1 text-sm leading-5 text-[#64748b]">Bay only records a booking after an operator accepts it and payment is confirmed.</p></div>
      </SectionCard>

      <SectionCard icon={<Clock3 className="h-5 w-5" />} title="Parking history" detail="Places you’ve opened directions to.">
        {loading ? <p className="mt-4 text-sm text-[#64748b]">Loading your activity…</p> : visits.length === 0 ? <EmptyText>Directions you open will appear here.</EmptyText> : <div className="mt-4 divide-y divide-[#eef2f7]">{visits.map(visit => <div key={visit.id} className="flex items-center gap-3 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]"><MapPin className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{visit.address_text}</span>{visit.country && <span className="block truncate text-xs text-[#64748b]">{visit.country}</span>}</span><span className="max-w-20 text-right text-[11px] leading-4 text-[#94a3b8]">{formatWhen(visit.visited_at)}</span><ChevronRight className="h-4 w-4 text-[#94a3b8]" /></div>)}</div>}
      </SectionCard>

      <SectionCard icon={<FileText className="h-5 w-5" />} title="Signs I’ve reported" detail="Your contributions keep parking information useful.">
        {loading ? <p className="mt-4 text-sm text-[#64748b]">Loading your reports…</p> : signs.length === 0 ? <div className="mt-4 rounded-2xl bg-[#f7faff] px-4 py-5 text-center"><FileText className="mx-auto h-8 w-8 text-[#1769ff]" /><p className="mt-3 font-semibold">No signs reported yet</p><p className="mt-1 text-sm leading-5 text-[#64748b]">Add a photo of a parking sign when you see one.</p><button onClick={onAddSign} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20">Add a sign</button></div> : <div className="mt-4 space-y-3">{signs.map(spot => { const badge = MODERATION_BADGE[spot.moderation_status]; const Icon = badge.icon; return <div key={spot.id} className="space-y-2"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}><Icon className="h-3 w-3" />{badge.text}</span><SpotCard spot={spot} onClick={() => setSelectedSign(spot)} /></div> })}</div>}
      </SectionCard>

      <button onClick={onOpenFeedback} className="flex w-full items-center gap-3 rounded-2xl border border-[#dce7f8] bg-white p-4 text-left shadow-[0_12px_30px_rgba(37,99,235,.06)]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]"><Headphones className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">App support</span><span className="block text-xs text-[#64748b]">Get help or tell us what needs fixing.</span></span><MessageSquarePlus className="h-5 w-5 text-[#64748b]" /></button>
    </div>
    <SpotDetailSheet spot={selectedSign} onClose={() => setSelectedSign(null)} />
  </main>
}

function SectionCard({ icon, title, detail, children }: { icon: import('react').ReactNode; title: string; detail: string; children: import('react').ReactNode }) { return <section className="rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_12px_30px_rgba(37,99,235,.06)]"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]">{icon}</span><span><h2 className="text-lg font-bold tracking-tight">{title}</h2><p className="mt-0.5 text-sm text-[#64748b]">{detail}</p></span></div>{children}</section> }
function EmptyText({ children }: { children: import('react').ReactNode }) { return <p className="mt-4 rounded-2xl bg-[#f7faff] px-4 py-4 text-sm leading-5 text-[#64748b]">{children}</p> }
function SavedPlace({ icon, label, value }: { icon: import('react').ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-[#e6edf8] bg-[#fbfdff] px-3 py-3"><span className="text-[#1769ff]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="block truncate text-xs text-[#64748b]">{value}</span></span><ChevronRight className="h-4 w-4 text-[#94a3b8]" /></div> }
