import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Bookmark, BriefcaseBusiness, CarFront, ChevronDown, ChevronRight, HomeIcon, LocateFixed, MapPin, Navigation2, Radio, Search, Ticket, X } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { OptionSheet } from '../components/OptionSheet'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { ParkingAreaSheet } from '../components/ParkingAreaSheet'
import { useNearbyParking } from '../lib/useNearbyParking'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'
import { isMelbourneSearch } from '../lib/melbourneSensors'
import { evaluateSpotStatus, rankSpots } from '../lib/parkingStatus'
import { searchPlaces, type PlaceSearchResult } from '../lib/geocoding'
import { useClock } from '../lib/useClock'
import { formatCents, formatDurationShort, melbourneStart } from '../lib/parkingCost'
import { carParkOptions, loadCarParkRates, loadStreetRates, rankOptions, splitStreet, streetOptionHere, streetOptions, walkMinutes, type CarParkRatesFile, type ParkingOption, type StreetRatesFile } from '../lib/parkingOptions'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'
import { trackEvent } from '../lib/analytics'
import { endParking, useParkingSession } from '../lib/parkingTimer'
import { VENUES, type Venue } from '../lib/venues'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))

const DURATIONS = [30, 60, 120, 180, 240, 540]
/** Fetch a 10-minute walk once; show the 5-minute ring unless it has too few options. */
const NEAR_M = 400
const FAR_M = 800
const MIN_GOOD_OPTIONS = 3

const durationLabel = (d: number) => d === 540 ? 'All day' : formatDurationShort(d)
const clock = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })

const priceText = (o: ParkingOption) => o.cents != null ? (o.cents === 0 ? 'Free' : formatCents(o.cents)) : o.range ? `${formatCents(o.range.min)}–${formatCents(o.range.max)}` : null

export function Home({ center, myLocation, locationLabel, onChangeLocation, onUseCurrentLocation, savedLocations, onSavePlace, onSelectSavedPlace }: {
  center: { lat: number; lng: number }; myLocation?: { lat: number; lng: number }; locationLabel: string; onChangeLocation: () => void; onUseCurrentLocation: () => void
  savedLocations: SavedLocations; onSavePlace: (kind: SavedPlaceKind) => void; onSelectSavedPlace: (kind: SavedPlaceKind) => void
}) {
  const [duration, setDuration] = useState(120)
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string; note?: string } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)
  const [selectedArea, setSelectedArea] = useState<CarPark | null>(null)
  const [streetRates, setStreetRates] = useState<StreetRatesFile | null>(null)
  const [carParkRates, setCarParkRates] = useState<CarParkRatesFile | null>(null)
  const [rateError, setRateError] = useState(false)
  const [hereMessage, setHereMessage] = useState<string | null>(null)

  const target = destination ?? center
  const { session: parked, minutesLeft } = useParkingSession()
  const melbourne = isMelbourneSearch(target.lat, target.lng)
  const now = useClock()
  const { spots, loading } = useNearbyParking(target, FAR_M)
  const { carParks: mappedAreas } = useNearbyCarParks(target, NEAR_M, !melbourne)

  useEffect(() => {
    if (!melbourne) return
    Promise.all([loadStreetRates(), loadCarParkRates()])
      .then(([s, c]) => { setStreetRates(s); setCarParkRates(c); setRateError(false) })
      .catch(() => setRateError(true))
  }, [melbourne])
  useEffect(() => { setSelectedId(null); setHereMessage(null) }, [target.lat, target.lng])

  const start = useMemo(() => melbourneStart(now), [now])
  const allOptions = useMemo(() => melbourne
    ? rankOptions([...streetOptions(spots, streetRates, start, duration, now), ...carParkOptions(carParkRates, target, FAR_M, start, duration, now)])
    : [], [melbourne, spots, streetRates, carParkRates, start, duration, now, target])
  const { options, radius } = useMemo(() => {
    const near = allOptions.filter(o => o.distanceM <= NEAR_M)
    const good = (list: ParkingOption[]) => list.filter(o => o.fits !== false && priceText(o) != null).length
    return good(near) >= MIN_GOOD_OPTIONS ? { options: near, radius: NEAR_M } : { options: allOptions, radius: FAR_M }
  }, [allOptions])
  const fitting = options.filter(o => o.fits !== false && priceText(o) != null)
  const unpriced = options.filter(o => o.fits !== false && priceText(o) == null)
  const tooShort = options.filter(o => o.fits === false)
  const best = fitting[0]
  const others = fitting.slice(1)
  const selected = allOptions.find(o => o.id === selectedId) ?? null
  const otherCitySpots = useMemo(() => melbourne ? [] : rankSpots(spots, now).filter(s => s.distance_m <= NEAR_M), [melbourne, spots, now])
  const selectedRow = selectedSpot ? spots.find(s => s.id === selectedSpot.id) : null

  function pick(option: ParkingOption) { setSelectedId(option.id); trackEvent('parking_result_view', { result_type: option.kind }) }
  function goToVenue(venue: Venue) {
    setDestination({ lat: venue.lat, lng: venue.lng, label: venue.name, note: venue.note })
    setDuration(DURATIONS.includes(venue.minutes) ? venue.minutes : 240)
    setSearchOpen(false)
  }
  function canIParkHere() {
    setDestination(null)
    const found = streetOptionHere(allOptions, myLocation ?? center)
    if (found) { setHereMessage(null); pick(found.option) }
    else setHereMessage(myLocation ? 'No council bay within 40 m of you. Check the sign where you are.' : 'Turn on location so Bay can find the bay next to you.')
  }

  return <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white antialiased">
    <div className="relative min-h-0 flex-1">
      <Suspense fallback={<div className="h-full bg-[#eef4ff]" />}>
        <MapView center={target} myLocation={myLocation} zoom={radius === NEAR_M ? 17 : 16}
          spots={otherCitySpots} onSelectSpot={setSelectedSpot}
          carParks={melbourne ? [] : mappedAreas} onSelectCarPark={setSelectedArea}
          options={options.filter(o => o.fits !== false)} selectedOptionId={selectedId} onSelectOption={pick} />
      </Suspense>

      {/* Top: where + how long, one card */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-3 pt-[max(.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto max-w-xl rounded-[24px] bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.06),0_10px_30px_rgba(15,23,42,.12)]">
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 text-left transition-colors hover:bg-[#f5f8ff]" aria-label="Where are you going?">
              <Search className="h-5 w-5 shrink-0 text-[#1769ff]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-[#64748b]">{destination ? 'Parking near' : 'Where to?'}</span>
                <span className="block truncate text-[15px] font-semibold text-[#0b1730]">{destination ? destination.label : /current location/i.test(locationLabel) ? 'Near you' : `Near ${locationLabel}`}</span>
              </span>
            </button>
            {destination
              ? <button onClick={() => setDestination(null)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-[#64748b] hover:bg-[#f5f8ff]" aria-label="Back to near me"><X className="h-5 w-5" /></button>
              : <div className="relative">
                <button onClick={() => setSavedOpen(v => !v)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-[#40516d] hover:bg-[#f5f8ff]" aria-label="Saved places" aria-expanded={savedOpen}><Bookmark className="h-5 w-5" /></button>
                {savedOpen && <SavedMenu saved={savedLocations} onSave={onSavePlace} onSelect={onSelectSavedPlace} onChangeArea={onChangeLocation} onClose={() => setSavedOpen(false)} />}
              </div>}
          </div>
          {melbourne && <div className="mt-1 border-t border-[#eef2f7] px-1 pt-1.5">
            <div className="flex items-center gap-0.5" role="radiogroup" aria-label="How long are you staying?">
              <span className="shrink-0 pl-1.5 pr-0.5 text-xs font-semibold text-[#64748b]">Stay</span>
              {DURATIONS.map(d => <button key={d} role="radio" aria-checked={duration === d} onClick={() => setDuration(d)}
                className={`h-11 min-w-0 flex-1 whitespace-nowrap rounded-[14px] px-1 text-[13px] font-bold tabular-nums transition-[background-color,color,transform] active:scale-[0.97] ${duration === d ? 'bg-[#1769ff] text-white shadow-[0_4px_12px_rgba(23,105,255,.35)]' : 'text-[#40516d] hover:bg-[#f5f8ff]'}`}>{durationLabel(d)}</button>)}
            </div>
          </div>}
        </div>
      </header>

      {/* Bottom sheet: the answer first */}
      <section className={`absolute inset-x-0 bottom-0 z-[450] mx-auto flex max-w-xl flex-col rounded-t-[28px] bg-white shadow-[0_-1px_2px_rgba(15,23,42,.06),0_-14px_40px_rgba(15,23,42,.14)] transition-[max-height] duration-300 ${expanded ? 'max-h-[78%]' : 'max-h-[44%]'}`}>
        {/* Floating actions ride on top of the sheet */}
        <div className={`pointer-events-none absolute -top-[60px] right-3 flex items-center gap-2 transition-opacity duration-200 ${expanded ? 'opacity-0 [&>*]:pointer-events-none' : 'opacity-100'}`} aria-hidden={expanded}>
          {melbourne && <button tabIndex={expanded ? -1 : 0} onClick={canIParkHere} className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-white pl-3.5 pr-4 text-sm font-bold text-[#0b1730] shadow-[0_1px_2px_rgba(15,23,42,.08),0_8px_24px_rgba(15,23,42,.16)] transition-transform active:scale-[0.97]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1769ff] text-white"><MapPin className="h-3.5 w-3.5" /></span>Can I park here?
          </button>}
          <button tabIndex={expanded ? -1 : 0} onClick={() => { setDestination(null); onUseCurrentLocation() }} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1769ff] shadow-[0_1px_2px_rgba(15,23,42,.08),0_8px_24px_rgba(15,23,42,.16)] transition-transform active:scale-[0.97]" aria-label="Centre on my location"><LocateFixed className="h-5 w-5" /></button>
        </div>

        {parked && minutesLeft != null && <div className="px-3 pt-3"><ParkingTimerBar name={parked.name} leaveBy={parked.leaveBy} minutesLeft={minutesLeft} onEnd={() => void endParking()} /></div>}
        <button onClick={() => setExpanded(v => !v)} className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200" aria-label={expanded ? 'Show less' : 'Show more'} />
        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-[#0b1730] [text-wrap:balance]">{melbourne ? `Best for ${duration === 540 ? 'the day' : durationLabel(duration)}` : 'Parking nearby'}</h2>
            <p className="text-xs text-[#64748b]">{loading ? 'Finding parking…' : melbourne ? `${fitting.length} option${fitting.length === 1 ? '' : 's'} within ${walkMinutes(radius)} min walk` : 'Prices are available in central Melbourne'}</p>
          </div>
          {melbourne && others.length > 2 && <button onClick={() => setExpanded(v => !v)} className="shrink-0 rounded-full px-3 py-2 text-sm font-bold text-[#1769ff] hover:bg-[#f5f8ff]">{expanded ? 'Less' : `See all ${fitting.length}`}</button>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {hereMessage && <p role="status" className="mx-2 mb-2 rounded-2xl bg-[#f5f8ff] px-3 py-2.5 text-sm text-[#40516d]">{hereMessage}</p>}
          {destination?.note && <p className="mx-2 mb-2 flex gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900"><Ticket className="h-4 w-4 shrink-0" />{destination.note}</p>}
          {rateError && <p className="mx-2 mb-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">Prices couldn't load. Check your connection.</p>}

          {melbourne && <>
            {loading && !best && <SkeletonRows />}
            {!loading && !best && <p className="px-2 py-3 text-sm text-[#40516d]">No priced parking within a {walkMinutes(FAR_M)} minute walk for {durationLabel(duration).toLowerCase()}. Try a shorter stay.</p>}
            {best && <BestCard option={best} duration={duration} now={now} onClick={() => pick(best)} />}
            {others.length > 0 && <ul className="mt-1">{(expanded ? others : others.slice(0, 2)).map(o => <OptionRow key={o.id} option={o} onClick={() => pick(o)} />)}</ul>}
            {expanded && unpriced.length > 0 && <Group title={`No price listed · ${unpriced.length}`} hint="Check the sign or meter"><ul>{unpriced.map(o => <OptionRow key={o.id} option={o} onClick={() => pick(o)} />)}</ul></Group>}
            {tooShort.length > 0 && <Group title={`Too short for ${durationLabel(duration).toLowerCase()} · ${tooShort.length}`} hint="Time limits are shorter than your stay"><ul>{tooShort.map(o => <OptionRow key={o.id} option={o} onClick={() => pick(o)} />)}</ul></Group>}
          </>}

          {!melbourne && <ul>{otherCitySpots.slice(0, expanded ? 50 : 5).map(s => <li key={s.id}><button onClick={() => setSelectedSpot(s)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-[#f5f8ff]"><MapPin className="h-5 w-5 text-[#1769ff]" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0b1730]">{s.address_text}</span><span className="text-xs tabular-nums text-[#64748b]">{walkMinutes(s.distance_m)} min</span></button></li>)}</ul>}
        </div>
      </section>
    </div>

    {searchOpen && <SearchOverlay near={center} onClose={() => setSearchOpen(false)} onVenue={goToVenue}
      onPick={place => { trackEvent('parking_search', { result_source: 'geocoder' }); setDestination({ lat: place.lat, lng: place.lng, label: place.name }); setSearchOpen(false) }} />}
    <OptionSheet key={selected?.id ?? 'none'} option={selected} durationMinutes={duration} arrival={now} onClose={() => setSelectedId(null)} />
    <SpotDetailSheet spot={selectedRow ? { ...selectedRow, status: evaluateSpotStatus(selectedRow.rules, selectedRow.lat, selectedRow.lng, now) } : null} onClose={() => setSelectedSpot(null)} />
    <ParkingAreaSheet area={selectedArea} onClose={() => setSelectedArea(null)} />
  </main>
}

function OptionTitle({ option }: { option: ParkingOption }) {
  if (option.kind === 'carpark') return <><span className="block truncate text-[15px] font-semibold text-[#0b1730]">{option.name}</span><span className="block truncate text-xs text-[#64748b]">{option.operator} car park · {option.rateName}</span></>
  const { title, block } = splitStreet(option.name)
  return <><span className="block truncate text-[15px] font-semibold text-[#0b1730]">{title}</span>{block && <span className="block truncate text-xs text-[#64748b]">{block}</span>}</>
}

function Facts({ option }: { option: ParkingOption }) {
  return <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[#40516d] tabular-nums"><Navigation2 className="h-3 w-3" />{walkMinutes(option.distanceM)} min walk</span>
    {option.limitMinutes != null && <span className={`rounded-full px-2 py-0.5 tabular-nums ${option.fits === false ? 'bg-amber-50 text-amber-900' : 'bg-[#f1f5f9] text-[#40516d]'}`}>{formatDurationShort(option.limitMinutes)} limit</span>}
    {option.live && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 tabular-nums"><Radio className="h-3 w-3" />{option.live.free} free now</span>}
  </span>
}

function BestCard({ option, duration, now, onClick }: { option: ParkingOption; duration: number; now: Date; onClick: () => void }) {
  const leave = option.limitMinutes != null && option.limitMinutes < duration ? option.limitMinutes : duration
  return <button onClick={onClick} className="w-full rounded-[22px] bg-[#f5f8ff] p-4 text-left shadow-[inset_0_0_0_1px_rgba(23,105,255,.14)] transition-transform active:scale-[0.99]">
    <span className="flex items-start gap-3">
      <span className="min-w-0 flex-1"><OptionTitle option={option} /></span>
      <span className="shrink-0 text-right">
        <span className="block text-[28px] font-extrabold leading-none tracking-tight text-[#0b1730] tabular-nums">{priceText(option)}</span>
        <span className="mt-1 block text-xs text-[#64748b]">for {durationLabel(duration).toLowerCase()}</span>
      </span>
    </span>
    <Facts option={option} />
    <span className="mt-3 flex items-center justify-between border-t border-[rgba(23,105,255,.12)] pt-3 text-sm">
      <span className="text-[#40516d]">Leave by <strong className="font-bold text-[#0b1730] tabular-nums">{clock(new Date(now.getTime() + leave * 60_000))}</strong></span>
      <span className="inline-flex items-center gap-0.5 font-bold text-[#1769ff]">Details<ChevronRight className="h-4 w-4" /></span>
    </span>
  </button>
}

function OptionRow({ option, onClick }: { option: ParkingOption; onClick: () => void }) {
  const price = option.fits === false ? null : priceText(option)
  return <li>
    <button onClick={onClick} className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-[#f5f8ff]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${option.kind === 'carpark' ? 'bg-[#1769ff] text-white' : 'bg-[#eef4ff] text-[#1769ff]'}`} aria-hidden>{option.kind === 'carpark' ? <CarFront className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}</span>
      <span className="min-w-0 flex-1"><OptionTitle option={option} /><Facts option={option} /></span>
      <span className="shrink-0 text-right text-base font-extrabold text-[#0b1730] tabular-nums">{price ?? <span className="text-sm font-semibold text-[#64748b]">{option.fits === false ? 'Too short' : 'Check sign'}</span>}</span>
    </button>
  </li>
}

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="mt-2 border-t border-[#eef2f7] pt-2">
    <button onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]">
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#40516d]">{title}</span><span className="block text-xs text-[#64748b]">{hint}</span></span>
      <ChevronDown className={`h-5 w-5 text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && children}
  </div>
}

function SkeletonRows() {
  return <div aria-hidden className="space-y-2 px-1">
    <div className="h-[132px] animate-pulse rounded-[22px] bg-[#f1f5f9]" />
    <div className="h-14 animate-pulse rounded-2xl bg-[#f6f8fb]" />
  </div>
}

function ParkingTimerBar({ name, leaveBy, minutesLeft, onEnd }: { name: string; leaveBy: string; minutesLeft: number; onEnd: () => void }) {
  const over = minutesLeft < 0
  const soon = !over && minutesLeft <= 15
  const tone = over ? 'bg-red-600 text-white' : soon ? 'bg-amber-400 text-[#2b1a00]' : 'bg-[#07152f] text-white'
  const left = over ? `${formatDurationShort(-minutesLeft)} over` : `${formatDurationShort(Math.max(minutesLeft, 0))} left`
  return <div role="timer" aria-live="polite" className={`flex items-center gap-3 rounded-[20px] py-2 pl-3.5 pr-2 shadow-[0_10px_30px_rgba(15,23,42,.18)] ${tone}`}>
    <BellRing className="h-5 w-5 shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold tabular-nums">{left} · leave by {clock(new Date(leaveBy))}</span>
      <span className="block truncate text-xs opacity-80">{name}</span>
    </span>
    <button onClick={onEnd} className="h-10 shrink-0 rounded-[14px] bg-white/15 px-3 text-xs font-bold transition-transform active:scale-[0.97]">I've left</button>
  </div>
}

function SearchOverlay({ near, onPick, onVenue, onClose }: { near: { lat: number; lng: number }; onPick: (place: PlaceSearchResult) => void; onVenue: (venue: Venue) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const request = useRef(0)
  async function run() {
    if (query.trim().length < 3) return
    const id = ++request.current; setBusy(true)
    const found = await searchPlaces(query, near).catch(() => [])
    if (id === request.current) { setResults(found); setBusy(false); setSearched(true) }
  }
  return <div className="fixed inset-0 z-[1100] overflow-y-auto bg-white px-3 pb-8 pt-[max(.75rem,env(safe-area-inset-top))]">
    <div className="mx-auto max-w-xl">
      <form onSubmit={e => { e.preventDefault(); void run() }} className="flex items-center gap-2 rounded-[20px] bg-[#f5f8ff] pl-3.5 pr-1.5 shadow-[inset_0_0_0_1px_#dce7f8] focus-within:shadow-[inset_0_0_0_2px_#1769ff]">
        <Search className="h-5 w-5 shrink-0 text-[#1769ff]" />
        <input autoFocus enterKeyHint="search" value={query} onChange={e => { request.current++; setQuery(e.target.value); setSearched(false) }} placeholder="Where are you going?" aria-label="Where are you going?" className="min-h-[52px] min-w-0 flex-1 bg-transparent text-base text-[#0b1730] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[#64748b]" />
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#64748b]" aria-label="Close"><X className="h-5 w-5" /></button>
      </form>
      {query.trim().length >= 3 && <button onClick={() => void run()} disabled={busy} className="mt-2 h-12 w-full rounded-[18px] bg-[#1769ff] text-sm font-bold text-white transition-transform active:scale-[0.99] disabled:opacity-60">{busy ? 'Searching…' : `Search “${query.trim()}”`}</button>}
      {results.length > 0 && <ul className="mt-3">{results.map((place, i) => <li key={`${place.name}-${i}`}><button onClick={() => onPick(place)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]"><MapPin className="h-5 w-5 shrink-0 text-[#1769ff]" /><span className="min-w-0"><span className="block text-[15px] font-semibold text-[#0b1730]">{place.name}</span>{place.address && <span className="block truncate text-xs text-[#64748b]">{place.address}</span>}</span></button></li>)}</ul>}
      {searched && !busy && results.length === 0 && <p className="mt-3 px-2 text-sm text-[#40516d]">No places found. Try a street name or landmark.</p>}
      {!query && <>
        <p className="mt-5 px-2 text-xs font-semibold text-[#64748b]">Going to an event?</p>
        <ul className="mt-1">{VENUES.map(v => <li key={v.id}><button onClick={() => onVenue(v)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#eef4ff] text-[#1769ff]"><Ticket className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-[#0b1730]">{v.name}</span><span className="block text-xs text-[#64748b]">Shows parking for {durationLabel(v.minutes).toLowerCase()}</span></span>
          <ChevronRight className="h-5 w-5 text-[#94a3b8]" />
        </button></li>)}</ul>
      </>}
    </div>
  </div>
}

function SavedMenu({ saved, onSave, onSelect, onChangeArea, onClose }: { saved: SavedLocations; onSave: (kind: SavedPlaceKind) => void; onSelect: (kind: SavedPlaceKind) => void; onChangeArea: () => void; onClose: () => void }) {
  const act = (fn: () => void) => { fn(); onClose() }
  const item = 'flex min-h-11 w-full items-center gap-2.5 rounded-[14px] px-3 text-left text-sm font-semibold text-[#0b1730] hover:bg-[#f5f8ff]'
  return <div className="absolute right-0 top-12 z-[700] w-60 rounded-[20px] bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.08),0_16px_40px_rgba(15,23,42,.18)]">
    {saved.home && <button onClick={() => act(() => onSelect('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#1769ff]" />Home</button>}
    {saved.work && <button onClick={() => act(() => onSelect('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#1769ff]" />Work</button>}
    <button onClick={() => act(() => onSave('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#64748b]" />Save this as home</button>
    <button onClick={() => act(() => onSave('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#64748b]" />Save this as work</button>
    <button onClick={() => act(onChangeArea)} className={item}><span className="flex h-4 w-4 items-center"><BrandMark className="w-4" /></span>Change city</button>
  </div>
}
