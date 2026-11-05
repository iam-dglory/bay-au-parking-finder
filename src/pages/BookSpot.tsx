import { ArrowLeft, Banknote, Building2, CalendarCheck2, CarFront, CheckCircle2, ChevronRight, CircleAlert, Clock3, CreditCard, ExternalLink, Home, MapPin, Navigation, ShieldCheck, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { HostSpaceForm } from '../components/HostSpaceForm'
import { bookableAreas } from '../lib/bookingEligibility'
import { formatAudCents, formatListingPrice, listingPrices, type MarketplaceListingSummary, type MarketplacePricePeriod } from '../lib/marketplace'
import { supabase } from '../lib/supabaseClient'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'
import { zoomForRadius } from '../lib/mapZoom'
import type { CarPark } from '../types'
import { trackEvent } from '../lib/analytics'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))

/** Two-sided private-space marketplace entry point. Listings are moderated,
 * while checkout stays unavailable until availability, fees, payment and
 * confirmation are all controlled and verified by trusted server code. */
export function Marketplace({ center, onFindParking }: { center: { lat: number; lng: number }; onFindParking: () => void }) {
  const { carParks, loading } = useNearbyCarParks(center, 5000, true)
  const eligible = useMemo(() => bookableAreas(carParks), [carParks])
  const [mode, setMode] = useState<'landing' | 'find' | 'host'>('landing')
  const [privateSpaces, setPrivateSpaces] = useState<MarketplaceListingSummary[]>([])
  const [selectedSpace, setSelectedSpace] = useState<MarketplaceListingSummary | null>(null)
  const [marketplaceLoading, setMarketplaceLoading] = useState(true)
  const [marketplaceReady, setMarketplaceReady] = useState(true)

  useEffect(() => {
    let cancelled = false
    setMarketplaceLoading(true)
    void supabase.rpc('nearby_marketplace_listings', { p_lat: center.lat, p_lng: center.lng, p_radius_m: 5000 }).then(async ({ data, error }) => {
      if (cancelled) return
      if (error) {
        setMarketplaceReady(false)
        setMarketplaceLoading(false)
        return
      }
      const rows = (data ?? []) as Array<Record<string, any>>
      const paths = rows.map(row => row.photo_path).filter(Boolean) as string[]
      const signed = paths.length ? await supabase.storage.from('listing-photos').createSignedUrls(paths, 3600) : { data: [] }
      const signedByPath = new Map((signed.data ?? []).map(item => [item.path, item.signedUrl]))
      setPrivateSpaces(rows.map(row => ({
        id: row.id,
        title: row.title,
        address_text: row.display_address,
        suburb: row.suburb,
        state: row.state,
        country: row.country,
        lat: row.lat,
        lng: row.lng,
        distance_m: row.distance_m,
        photo_url: row.photo_path ? signedByPath.get(row.photo_path) ?? null : null,
        space_type: row.space_type,
        currency: row.currency,
        price_per_hour: row.price_per_hour,
        price_per_day: row.price_per_day,
        price_per_week: row.price_per_week,
        price_per_month: row.price_per_month,
        price_per_year: row.price_per_year,
        instant_book: row.instant_book,
      })))
      setMarketplaceReady(true)
      setMarketplaceLoading(false)
    })
    return () => { cancelled = true }
  }, [center.lat, center.lng])

  const marketplaceMapAreas = useMemo<CarPark[]>(() => privateSpaces.map(space => ({
    id: `marketplace-${space.id}`,
    address_text: space.title,
    suburb: space.suburb,
    lat: space.lat,
    lng: space.lng,
    distance_m: space.distance_m,
    capacity: 1,
    census_year: null,
    kind: 'area',
    facility_type: 'Private host space',
    city: space.suburb ?? undefined,
    state: space.state ?? undefined,
    country: space.country,
    access: 'Host-approved access',
    price_summary: formatListingPrice(space),
    currency: space.currency,
    photo_url: space.photo_url,
    source_name: 'BAY Marketplace',
  })), [privateSpaces])

  return <main className="h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]">
    <header className="sticky top-0 z-20 border-b border-white/80 bg-[#f7faff]/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-start gap-3"><button onClick={() => mode === 'landing' ? onFindParking() : setMode('landing')} className="bay-icon-button !h-11 !w-11 !rounded-2xl" aria-label={mode === 'landing' ? 'Back to parking map' : 'Back to marketplace'}><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0 flex-1 text-center"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#1769ff]">BAY Marketplace · V2</p><h1 className="mt-1 text-xl font-bold tracking-tight">{mode === 'landing' ? 'Private parking, made useful' : mode === 'find' ? 'Find a private parking space' : 'Earn from your empty space'}</h1><p className="mt-1 text-sm text-[#64748b]">{mode === 'landing' ? 'Discover or list verified private spaces across Australia.' : mode === 'find' ? 'Compare approved spaces and know the price before you arrive.' : 'List a private driveway, garage or allocated bay.'}</p></div></div>
      {mode !== 'landing' && <div className="mt-4 grid grid-cols-2 rounded-2xl bg-blue-50 p-1"><button onClick={() => setMode('find')} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${mode === 'find' ? 'bg-white text-[#1769ff] shadow-sm' : 'text-[#64748b]'}`}><Navigation className="h-4 w-4" />Find a space</button><button onClick={() => setMode('host')} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${mode === 'host' ? 'bg-white text-[#1769ff] shadow-sm' : 'text-[#64748b]'}`}><Home className="h-4 w-4" />List your space</button></div>}
    </header>

    {mode === 'landing' ? <MarketplaceLanding onFind={() => setMode('find')} onHost={() => setMode('host')} /> : mode === 'host' ? <HostSpaceForm center={center} onBack={() => setMode('landing')} /> : <>

    <section className="mx-4 mt-4 h-48 overflow-hidden rounded-[26px] border border-[#dce7f8] bg-white shadow-[0_14px_30px_rgba(37,99,235,.08)]"><Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-[#64748b]">Loading map…</div>}><MapView center={center} myLocation={center} spots={[]} carParks={[...marketplaceMapAreas, ...eligible.map(item => item.area)]} zoom={zoomForRadius(5000)} /></Suspense></section>

    <section className="mx-4 mt-4 rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_14px_30px_rgba(37,99,235,.08)]">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]"><Home className="h-5 w-5" /></span><div><h2 className="text-lg font-bold">Private spaces near you</h2><p className="mt-1 text-sm text-[#64748b]">Hosted driveways, garages and allocated bays.</p></div></div>
      {marketplaceLoading ? <p className="mt-4 text-sm text-[#64748b]">Checking approved host spaces…</p> : privateSpaces.length ? <div className="mt-4 space-y-3">{privateSpaces.map(space => <button type="button" onClick={() => setSelectedSpace(space)} key={space.id} className="block w-full overflow-hidden rounded-2xl border border-[#dce7f8] bg-white text-left transition hover:border-blue-300 hover:shadow-md"><div className="flex gap-3 p-3">{space.photo_url ? <img src={space.photo_url} alt="Host parking space" className="h-24 w-24 shrink-0 rounded-xl object-cover" /> : <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]"><Home className="h-7 w-7" /></span>}<div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-emerald-600">Approved private space</p><div className="flex items-center gap-2"><h3 className="mt-1 min-w-0 flex-1 truncate font-bold">{space.title}</h3><ChevronRight className="h-4 w-4 shrink-0 text-[#1769ff]" /></div><p className="mt-1 flex items-center gap-1 text-xs text-[#64748b]"><MapPin className="h-3.5 w-3.5" />{space.address_text || 'Approximate location'} · {Math.round(space.distance_m)} m</p><p className="mt-2 flex items-center gap-1 text-sm font-bold text-[#1769ff]"><Banknote className="h-4 w-4" />{formatListingPrice(space)}</p></div></div><div className="border-t border-[#eef2f7] bg-[#f8fbff] px-3 py-2.5 text-xs leading-5 text-[#64748b]">View pricing, access type and booking readiness.</div></button>)}</div> : <div className="mt-4 rounded-2xl bg-[#f7faff] px-4 py-4"><p className="font-semibold">No approved private spaces nearby yet</p><p className="mt-1 text-sm leading-5 text-[#64748b]">Be the first host in this area, or use an operator-supported car park below.</p><button onClick={() => setMode('host')} className="mt-3 text-sm font-bold text-[#1769ff]">List a private space</button>{!marketplaceReady && <p className="mt-3 flex gap-2 text-xs text-amber-700"><CircleAlert className="h-4 w-4 shrink-0" />The marketplace database migration still needs to be applied before listings can go live.</p>}</div>}
    </section>

    <section className="mx-4 mt-4 rounded-[26px] border border-[#dce7f8] bg-white p-5 shadow-[0_14px_30px_rgba(37,99,235,.08)]">
      {loading ? <div className="flex items-center gap-3 text-sm text-[#64748b]"><CalendarCheck2 className="h-5 w-5 animate-pulse text-[#1769ff]" />Checking verified booking providers…</div> : eligible.length === 0 ? <><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]"><CalendarCheck2 className="h-6 w-6" /></span><h2 className="mt-4 text-lg font-bold">No online-bookable parking areas found nearby.</h2><p className="mt-2 text-sm leading-6 text-[#64748b]">Try another location or explore nearby parking on the map.</p><button onClick={onFindParking} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20"><Navigation className="h-4 w-4" />Find parking</button><p className="mt-4 flex gap-2 rounded-xl bg-[#f7faff] px-3 py-3 text-xs leading-5 text-[#64748b]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#1769ff]" />Bay has no verified operator reservation or payment integration for this area yet, so checkout is unavailable.</p></> : <div className="space-y-3">{eligible.map(({ area, provider }) => <article key={area.id} className="rounded-2xl border border-[#dce7f8] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#1769ff]">External booking</p><h2 className="mt-1 text-base font-bold">{area.address_text}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#64748b]"><MapPin className="h-4 w-4" />{Math.round(area.distance_m)} m away · {provider.operatorName}</p>{area.price_summary && <p className="mt-2 text-sm font-semibold text-[#0b1730]">{area.price_summary}</p>}<a href={provider.bookingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1769ff] px-4 py-2.5 text-sm font-bold text-white"><ExternalLink className="h-4 w-4" />Book with operator</a><p className="mt-2 flex gap-1.5 text-xs text-[#64748b]"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#1769ff]" />Booking takes place with {provider.operatorName}. Its prices, deposit and terms apply.</p></article>)}</div>}
    </section>
    </>}
    {selectedSpace && <MarketplaceListingSheet listing={selectedSpace} onClose={() => setSelectedSpace(null)} />}
  </main>
}

function MarketplaceLanding({ onFind, onHost }: { onFind: () => void; onHost: () => void }) {
  const trust = [
    { icon: CarFront, label: 'Private spaces' },
    { icon: Clock3, label: 'Flexible durations' },
    { icon: ShieldCheck, label: 'Verified hosts' },
    { icon: CreditCard, label: 'Secure checkout' },
  ]
  return <div className="px-4 pb-8 pt-4">
    <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#07152f] via-[#0a2859] to-[#1769ff] p-6 text-white shadow-[0_18px_40px_rgba(23,105,255,.22)]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">Choose how you use BAY</p>
      <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight">Park closer—or earn from unused space.</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">The marketplace is separate from BAY’s public parking map. Every host listing is reviewed before drivers can see it.</p>
    </section>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <button onClick={onFind} className="group rounded-[26px] border border-[#dce7f8] bg-white p-5 text-left shadow-[0_12px_28px_rgba(37,99,235,.08)] transition hover:-translate-y-0.5 hover:border-blue-300">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]"><Navigation className="h-6 w-6" /></span>
        <span className="mt-4 flex items-center gap-2 text-lg font-bold">Find a private space<ChevronRight className="ml-auto h-5 w-5 text-[#1769ff] transition group-hover:translate-x-1" /></span>
        <span className="mt-2 block text-sm leading-6 text-[#64748b]">Browse approved driveways, garages and apartment bays near your destination.</span>
      </button>
      <button onClick={onHost} className="group rounded-[26px] border border-[#dce7f8] bg-white p-5 text-left shadow-[0_12px_28px_rgba(37,99,235,.08)] transition hover:-translate-y-0.5 hover:border-blue-300">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Building2 className="h-6 w-6" /></span>
        <span className="mt-4 flex items-center gap-2 text-lg font-bold">List your space<ChevronRight className="ml-auto h-5 w-5 text-[#1769ff] transition group-hover:translate-x-1" /></span>
        <span className="mt-2 block text-sm leading-6 text-[#64748b]">Set availability and hourly, daily, weekly or monthly pricing.</span>
      </button>
    </div>
    <section className="mt-4 rounded-[26px] border border-[#dce7f8] bg-white p-4 shadow-[0_12px_28px_rgba(37,99,235,.06)]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{trust.map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-2 rounded-2xl bg-[#f7faff] px-3 py-3 text-xs font-bold text-[#40516d]"><Icon className="h-4.5 w-4.5 shrink-0 text-[#1769ff]" />{label}</div>)}</div>
      <p className="mt-3 flex gap-2 rounded-2xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />Payments and confirmed reservations activate only after availability, identity, payout and webhook checks are connected. BAY will not show a false confirmation.</p>
    </section>
  </div>
}

function MarketplaceListingSheet({ listing, onClose }: { listing: MarketplaceListingSummary; onClose: () => void }) {
  const availablePrices = listingPrices(listing)
  const [period, setPeriod] = useState<MarketplacePricePeriod>(availablePrices[0]?.period ?? 'hour')
  const [quantity, setQuantity] = useState(period === 'hour' ? 2 : 1)
  const [startsAt, setStartsAt] = useState(() => {
    const value = new Date(Date.now() + 60 * 60 * 1000)
    value.setMinutes(0, 0, 0)
    const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    return local.toISOString().slice(0, 16)
  })
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const selectedPrice = availablePrices.find(item => item.period === period)
  const subtotalCents = Math.round((selectedPrice?.amount ?? 0) * 100) * quantity

  function choosePeriod(nextPeriod: MarketplacePricePeriod) {
    setPeriod(nextPeriod)
    setQuantity(nextPeriod === 'hour' ? 2 : 1)
    setReviewing(false)
    setNotice(null)
  }

  async function checkout() {
    if (!selectedPrice || !startsAt) return
    setSubmitting(true)
    setNotice(null)
    const idempotencyKey = crypto.randomUUID()
    const { data, error } = await supabase.functions.invoke('marketplace-create-checkout', {
      body: { listingId: listing.id, startsAt: new Date(startsAt).toISOString(), period, quantity },
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    setSubmitting(false)
    if (error || !data?.checkoutUrl) {
      setNotice(error?.message ?? data?.error ?? 'Secure checkout is not available for this space yet.')
      return
    }
    window.location.assign(data.checkoutUrl)
  }
  return <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-slate-950/35 sm:items-center sm:p-5" onClick={onClose}>
    <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[30px] bg-white shadow-2xl sm:rounded-[30px]" onClick={event => event.stopPropagation()}>
      <div className="relative">{listing.photo_url ? <img src={listing.photo_url} alt={listing.title} className="h-56 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-[#1769ff]"><Home className="h-12 w-12" /></div>}<button onClick={onClose} className="bay-icon-button absolute right-4 top-4 !border-white/80 !bg-white/95 shadow-lg" aria-label="Close listing"><X className="h-5 w-5" /></button></div>
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] text-emerald-600"><CheckCircle2 className="h-4 w-4" />Approved private space</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0b1730]">{listing.title}</h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#64748b]"><MapPin className="h-4 w-4" />{listing.address_text || `${listing.suburb ?? ''} ${listing.state ?? ''}`.trim() || 'Approximate location'} · {Math.round(listing.distance_m)} m away</p>
        <div className="mt-4 grid grid-cols-3 gap-2"><InfoTile icon={Home} label="Space" value={listing.space_type.replaceAll('_', ' ')} /><InfoTile icon={Banknote} label="Price" value={formatListingPrice(listing)} /><InfoTile icon={Clock3} label="Booking" value={listing.instant_book ? 'Instant' : 'Request'} /></div>
        <div className="mt-4 rounded-2xl border border-[#dce7f8] bg-[#f8fbff] p-4"><p className="text-sm font-bold">Before you book</p><ul className="mt-2 space-y-2 text-sm leading-5 text-[#64748b]"><li>• Exact entry details stay private until a booking is confirmed.</li><li>• The host controls access rules and availability.</li><li>• BAY recalculates pricing and prevents overlapping bookings server-side.</li></ul></div>
        {availablePrices.length > 0 && <div className="mt-4 rounded-2xl border border-[#dce7f8] p-4"><p className="text-sm font-bold">Choose date, time and duration</p><label className="mt-3 block text-xs font-bold text-[#64748b]">Start time<input type="datetime-local" value={startsAt} onChange={event => { setStartsAt(event.target.value); setReviewing(false) }} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f8] px-3 text-sm text-[#0b1730]" /></label><div className="mt-3 grid grid-cols-2 gap-2">{availablePrices.map(price => <button type="button" key={price.period} onClick={() => choosePeriod(price.period)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold capitalize ${period === price.period ? 'border-[#1769ff] bg-blue-50 text-[#1769ff]' : 'border-[#dce7f8] text-[#40516d]'}`}>{price.period}<span className="block font-normal normal-case">A${price.amount.toFixed(2)}</span></button>)}</div><label className="mt-3 block text-xs font-bold text-[#64748b]">Number of {period === 'hour' ? 'hours (2–24)' : period === 'day' ? 'days' : period === 'week' ? 'weeks' : '30-day months'}<input type="number" min={period === 'hour' ? 2 : 1} max={period === 'hour' ? 24 : undefined} value={quantity} onChange={event => { setQuantity(Math.max(period === 'hour' ? 2 : 1, Number(event.target.value) || 1)); setReviewing(false) }} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f8] px-3 text-sm text-[#0b1730]" /></label></div>}
        {reviewing && <div className="mt-4 rounded-2xl bg-blue-50/70 p-4"><div className="flex justify-between text-sm"><span>Parking subtotal</span><strong>{formatAudCents(subtotalCents)}</strong></div><div className="mt-2 flex justify-between text-sm"><span>Driver service fee</span><strong>{formatAudCents(0)}</strong></div><div className="mt-3 flex justify-between border-t border-blue-100 pt-3 text-base"><span className="font-bold">Total</span><strong>{formatAudCents(subtotalCents)}</strong></div><p className="mt-3 text-xs leading-5 text-[#64748b]">Draft cancellation policy: 100% more than 24 hours before, 75% at 6–24 hours, 50% under 6 hours, and 0% after start. Statutory rights still apply.</p></div>}
        {notice && <p className="mt-4 flex gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p>}
        {!reviewing ? <button disabled={!selectedPrice || subtotalCents < 500} onClick={() => { trackEvent('booking_started', { period }); setReviewing(true) }} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769ff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"><CalendarCheck2 className="h-5 w-5" />Review price</button> : <button disabled={submitting} onClick={() => void checkout()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1769ff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"><CreditCard className="h-5 w-5" />{submitting ? 'Opening secure checkout…' : 'Continue to secure payment'}</button>}
      </div>
    </section>
  </div>
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className="min-w-0 rounded-2xl bg-blue-50/70 p-3"><Icon className="h-4 w-4 text-[#1769ff]" /><p className="mt-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#64748b]">{label}</p><p className="mt-1 truncate text-xs font-bold capitalize text-[#0b1730]">{value}</p></div>
}
