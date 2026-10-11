import { ArrowLeft, CalendarCheck2, CircleAlert, ExternalLink, MapPin, Navigation, ShieldCheck } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { bookableAreas } from '../lib/bookingEligibility'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'
import { zoomForRadius } from '../lib/mapZoom'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))

/** A safe booking entry point. It renders only verified external provider
 * links. There is deliberately no Bay checkout until provider availability,
 * deposit rules and payment confirmation are connected server-side. */
export function BookSpot({ center, onFindParking }: { center: { lat: number; lng: number }; onFindParking: () => void }) {
  const { carParks, loading } = useNearbyCarParks(center, 5000, true)
  const eligible = useMemo(() => bookableAreas(carParks), [carParks])

  return <main className="h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]">
    <header className="sticky top-0 z-20 border-b border-white/80 bg-[#f7faff]/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-start gap-3"><button onClick={onFindParking} className="bay-icon-button !h-11 !w-11 !rounded-2xl" aria-label="Back to parking map"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0 flex-1 text-center"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#1769ff]">Book parking</p><h1 className="mt-1 text-xl font-bold tracking-tight">Reserve a parking spot</h1><p className="mt-1 text-sm text-[#64748b]">Book ahead at parking areas that support online reservations.</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-[#1769ff]">Step 1 of 3</span></div>
      <ol className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold"><li className="text-[#1769ff]"><span className="mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#1769ff] ring-4 ring-blue-100" />Choose parking</li><li className="text-[#94a3b8]"><span className="mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#dbe7f8]" />Details & deposit</li><li className="text-[#94a3b8]"><span className="mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full bg-[#dbe7f8]" />Confirmation</li></ol>
    </header>

    <section className="mx-4 mt-4 h-48 overflow-hidden rounded-[26px] border border-[#dce7f8] bg-white shadow-[0_14px_30px_rgba(37,99,235,.08)]"><Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-[#64748b]">Loading map…</div>}><MapView center={center} myLocation={center} spots={[]} carParks={eligible.map(item => item.area)} zoom={zoomForRadius(5000)} /></Suspense></section>

    <section className="mx-4 mt-4 rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_14px_30px_rgba(37,99,235,.08)]">
      {loading ? <div className="flex items-center gap-3 text-sm text-[#64748b]"><CalendarCheck2 className="h-5 w-5 animate-pulse text-[#1769ff]" />Checking verified booking providers…</div> : eligible.length === 0 ? <><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]"><CalendarCheck2 className="h-6 w-6" /></span><h2 className="mt-4 text-lg font-bold">No online-bookable parking areas found nearby.</h2><p className="mt-2 text-sm leading-6 text-[#64748b]">Try another location or explore nearby parking on the map.</p><button onClick={onFindParking} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20"><Navigation className="h-4 w-4" />Find parking</button><p className="mt-4 flex gap-2 rounded-xl bg-[#f7faff] px-3 py-3 text-xs leading-5 text-[#64748b]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#1769ff]" />Bay has no verified operator reservation or payment integration for this area yet, so checkout is unavailable.</p></> : <div className="space-y-3">{eligible.map(({ area, provider }) => <article key={area.id} className="rounded-2xl border border-[#dce7f8] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#1769ff]">External booking</p><h2 className="mt-1 text-base font-bold">{area.address_text}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#64748b]"><MapPin className="h-4 w-4" />{Math.round(area.distance_m)} m away · {provider.operatorName}</p>{area.price_summary && <p className="mt-2 text-sm font-semibold text-[#0b1730]">{area.price_summary}</p>}<a href={provider.bookingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white"><ExternalLink className="h-4 w-4" />Book with operator</a><p className="mt-2 flex gap-1.5 text-xs text-[#64748b]"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#1769ff]" />Booking takes place with {provider.operatorName}. Its prices, deposit and terms apply.</p></article>)}</div>}
    </section>
  </main>
}
