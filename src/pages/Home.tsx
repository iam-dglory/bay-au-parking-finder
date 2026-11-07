import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Bookmark, CircleHelp, Ticket, BriefcaseBusiness, CarFront, ChevronDown, ChevronUp, HomeIcon, LocateFixed, MapPin, Radio, Search, X } from 'lucide-react'
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
import { carParkOptions, loadCarParkRates, loadStreetRates, rankOptions, shortStreetName, streetOptionHere, streetOptions, type CarParkRatesFile, type ParkingOption, type StreetRatesFile } from '../lib/parkingOptions'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'
import { trackEvent } from '../lib/analytics'
import { endParking, useParkingSession } from '../lib/parkingTimer'
import { VENUES, type Venue } from '../lib/venues'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))

const DURATIONS = [30, 60, 120, 180, 240, 540]
const WALKS = [{ label: '5 min walk', metres: 400, zoom: 17 }, { label: '10 min walk', metres: 800, zoom: 16 }]

export function Home({ center, myLocation, locationLabel, onChangeLocation, onUseCurrentLocation, savedLocations, onSavePlace, onSelectSavedPlace }: {
  center: { lat: number; lng: number }; myLocation?: { lat: number; lng: number }; locationLabel: string; onChangeLocation: () => void; onUseCurrentLocation: () => void
  savedLocations: SavedLocations; onSavePlace: (kind: SavedPlaceKind) => void; onSelectSavedPlace: (kind: SavedPlaceKind) => void
}) {
  const [duration, setDuration] = useState(120)
  const [walk, setWalk] = useState(WALKS[0])
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string; note?: string } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)
  const [selectedArea, setSelectedArea] = useState<CarPark | null>(null)
  const [streetRates, setStreetRates] = useState<StreetRatesFile | null>(null)
  const [carParkRates, setCarParkRates] = useState<CarParkRatesFile | null>(null)
  const [rateError, setRateError] = useState(false)

  const target = destination ?? center
  const { session: parked, minutesLeft } = useParkingSession()
  const melbourne = isMelbourneSearch(target.lat, target.lng)
  const now = useClock()
  const { spots, loading } = useNearbyParking(target, walk.metres)
  const { carParks: mappedAreas } = useNearbyCarParks(target, walk.metres, !melbourne)

  useEffect(() => {
    if (!melbourne) return
    Promise.all([loadStreetRates(), loadCarParkRates()])
      .then(([s, c]) => { setStreetRates(s); setCarParkRates(c); setRateError(false) })
      .catch(() => setRateError(true))
  }, [melbourne])
  useEffect(() => { setSelectedId(null) }, [target.lat, target.lng])

  const start = useMemo(() => melbourneStart(now), [now])
  const options = useMemo(() => melbourne
    ? rankOptions([...streetOptions(spots, streetRates, start, duration, now), ...carParkOptions(carParkRates, target, walk.metres, start, duration, now)])
    : [], [melbourne, spots, streetRates, carParkRates, start, duration, now, target, walk.metres])
  const selected = options.find(o => o.id === selectedId) ?? null
  const cheapest = options.find(o => o.fits !== false && o.cents != null)
  const otherCitySpots = useMemo(() => melbourne ? [] : rankSpots(spots, now), [melbourne, spots, now])
  const selectedRow = selectedSpot ? spots.find(s => s.id === selectedSpot.id) : null

  const [hereMessage, setHereMessage] = useState<string | null>(null)
  function goToVenue(venue: Venue) {
    setDestination({ lat: venue.lat, lng: venue.lng, label: venue.name, note: venue.note })
    setDuration(DURATIONS.includes(venue.minutes) ? venue.minutes : 240)
    setWalk(WALKS[1])
    setHereMessage(null)
  }
  function canIParkHere() {
    if (destination) setDestination(null)
    const here = myLocation ?? center
    const found = streetOptionHere(options, here)
    if (found) { setHereMessage(null); pick(found.option) }
    else setHereMessage(myLocation ? 'No council bay within 40 m of you. Read the sign where you are, or pick a spot from the list.' : 'Turn on location so Bay can find the bay you are next to.')
  }

  function pick(option: ParkingOption) { setSelectedId(option.id); trackEvent('parking_result_view', { result_type: option.kind }) }

  return <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
    <div className="relative min-h-0 flex-1">
      <Suspense fallback={<div className="h-full bg-[#eef4ff]" />}>
        <MapView center={target} myLocation={myLocation} zoom={walk.zoom}
          spots={otherCitySpots} onSelectSpot={setSelectedSpot}
          carParks={melbourne ? [] : mappedAreas} onSelectCarPark={setSelectedArea}
          options={options} selectedOptionId={selectedId} onSelectOption={pick} />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-3 pt-[max(.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto mx-auto max-w-xl space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-white px-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,.12)]" aria-label="Search a destination">
              <Search className="h-5 w-5 shrink-0 text-[#1769ff]" />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#0b1730]">{destination ? destination.label : locationLabel}</span>
              {destination && <span role="button" tabIndex={0} aria-label="Clear destination" onClick={e => { e.stopPropagation(); setDestination(null) }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setDestination(null) } }} className="rounded-lg p-1 text-[#64748b]"><X className="h-4 w-4" /></span>}
            </button>
            <button onClick={() => { setDestination(null); onUseCurrentLocation() }} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1769ff] shadow-[0_8px_24px_rgba(15,23,42,.12)]" aria-label="Use my location"><LocateFixed className="h-5 w-5" /></button>
            <div className="relative">
              <button onClick={() => setSavedOpen(v => !v)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#40516d] shadow-[0_8px_24px_rgba(15,23,42,.12)]" aria-label="Saved places"><Bookmark className="h-5 w-5" /></button>
              {savedOpen && <SavedMenu saved={savedLocations} onSave={onSavePlace} onSelect={onSelectSavedPlace} onChangeArea={onChangeLocation} onClose={() => setSavedOpen(false)} />}
            </div>
          </div>
          {melbourne && <div className="rounded-2xl bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,.12)]">
            <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#64748b]">How long are you staying?</p>
            <div className="mt-1 flex gap-1 overflow-x-auto [scrollbar-width:none]" role="radiogroup" aria-label="Length of stay">
              {DURATIONS.map(d => <button key={d} role="radio" aria-checked={duration === d} onClick={() => setDuration(d)} className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold transition ${duration === d ? 'bg-[#1769ff] text-white' : 'text-[#40516d] hover:bg-[#f5f8ff]'}`}>{d === 540 ? 'All day' : formatDurationShort(d)}</button>)}
            </div>
          </div>}
        </div>
      </header>

      <section className={`absolute inset-x-0 bottom-0 z-[450] mx-auto max-w-xl rounded-t-[28px] bg-white shadow-[0_-12px_36px_rgba(15,23,42,.14)] transition-[max-height] ${listOpen ? 'max-h-[72%]' : 'max-h-[46%]'} flex flex-col`}>
        {parked && minutesLeft != null && <ParkingTimerBar name={parked.name} leaveBy={parked.leaveBy} minutesLeft={minutesLeft} onEnd={() => void endParking()} />}
        <button onClick={() => setListOpen(v => !v)} className="flex w-full items-center gap-2 px-5 pb-2 pt-3 text-left" aria-expanded={listOpen}>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-[#0b1730]">{melbourne ? `Cheapest for ${duration === 540 ? 'the day' : formatDurationShort(duration)}` : 'Parking nearby'}</span>
            <span className="block text-xs text-[#64748b]">{loading ? 'Updating…' : melbourne ? `${options.length} options within a ${walk.label}${cheapest ? ` · from ${formatCents(cheapest.cents!)}` : ''}` : `${otherCitySpots.length + mappedAreas.length} mapped places · prices are available in central Melbourne`}</span>
          </span>
          {listOpen ? <ChevronDown className="h-5 w-5 text-[#64748b]" /> : <ChevronUp className="h-5 w-5 text-[#64748b]" />}
        </button>
        {melbourne && !destination && <div className="px-3 pb-2">
          <button onClick={canIParkHere} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#07152f] text-sm font-bold text-white"><CircleHelp className="h-4 w-4" />Can I park here?</button>
          {hereMessage && <p role="status" className="mt-2 rounded-xl bg-[#f5f8ff] px-3 py-2 text-xs text-[#40516d]">{hereMessage}</p>}
        </div>}
        {melbourne && <div className="flex items-center gap-1.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]" aria-label="Going to an event">
          <Ticket className="h-4 w-4 shrink-0 text-[#64748b]" />
          {VENUES.map(v => <button key={v.id} onClick={() => goToVenue(v)} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${destination?.label === v.name ? 'border-[#1769ff] bg-blue-50 text-[#1769ff]' : 'border-[#e3eaf3] text-[#40516d]'}`}>{v.name}</button>)}
        </div>}
        {destination?.note && <p className="mx-5 mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{destination.note}</p>}
        <div className="flex gap-1.5 px-5 pb-2">
          {WALKS.map(w => <button key={w.metres} onClick={() => setWalk(w)} className={`rounded-full border px-3 py-1 text-xs font-bold ${walk.metres === w.metres ? 'border-[#1769ff] bg-blue-50 text-[#1769ff]' : 'border-[#e3eaf3] text-[#64748b]'}`}>{w.label}</button>)}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {rateError && <p className="mx-2 mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Prices could not load. Check your connection.</p>}
          {melbourne && !loading && options.length === 0 && <p className="px-2 py-4 text-sm text-[#64748b]">No priced parking found within a {walk.label}. Try 10 min walk.</p>}
          {melbourne ? <ul className="space-y-1.5">{(listOpen ? options : options.slice(0, 4)).map(o => <OptionRow key={o.id} option={o} onClick={() => pick(o)} />)}</ul>
            : <ul className="space-y-1.5">{otherCitySpots.slice(0, listOpen ? 50 : 4).map(s => <li key={s.id}><button onClick={() => setSelectedSpot(s)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-[#f5f8ff]"><MapPin className="h-5 w-5 text-[#1769ff]" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.address_text}</span><span className="text-xs text-[#64748b]">{Math.round(s.distance_m)} m</span></button></li>)}</ul>}
        </div>
      </section>
    </div>

    {searchOpen && <SearchOverlay near={center} onClose={() => setSearchOpen(false)} onPick={place => { trackEvent('parking_search', { result_source: 'geocoder' }); setDestination({ lat: place.lat, lng: place.lng, label: place.name }); setSearchOpen(false) }} />}
    <OptionSheet key={selected?.id ?? 'none'} option={selected} durationMinutes={duration} arrival={now} onClose={() => setSelectedId(null)} />
    <SpotDetailSheet spot={selectedRow ? { ...selectedRow, status: evaluateSpotStatus(selectedRow.rules, selectedRow.lat, selectedRow.lng, now) } : null} onClose={() => setSelectedSpot(null)} />
    <ParkingAreaSheet area={selectedArea} onClose={() => setSelectedArea(null)} />
  </main>
}

function OptionRow({ option, onClick }: { option: ParkingOption; onClick: () => void }) {
  const blocked = option.fits === false
  const price = blocked ? `${formatDurationShort(option.limitMinutes ?? 0)} max` : option.cents != null ? formatCents(option.cents) : option.range ? `${formatCents(option.range.min)}–${formatCents(option.range.max)}` : '—'
  const detail = option.kind === 'carpark'
    ? `${option.operator} · ${option.rateName}`
    : [option.limitMinutes != null ? `${formatDurationShort(option.limitMinutes)} limit` : null, option.cents === 0 ? 'Free now' : null, option.cents == null && !option.range ? 'Check sign' : null].filter(Boolean).join(' · ') || 'Meter'
  return <li>
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-[#f5f8ff] ${blocked ? 'opacity-60' : ''}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${option.kind === 'carpark' ? 'bg-[#1769ff] text-white' : 'bg-blue-50 text-[#1769ff]'}`}>{option.kind === 'carpark' ? <CarFront className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#0b1730]">{option.kind === 'street' ? shortStreetName(option.name) : option.name}</span>
        <span className="flex items-center gap-1.5 truncate text-xs text-[#64748b]">{detail} · {Math.round(option.distanceM)} m{option.live && <span className="inline-flex items-center gap-0.5 text-[#059669]"><Radio className="h-3 w-3" />{option.live.free} free</span>}</span>
      </span>
      <span className={`shrink-0 text-right text-base font-extrabold ${blocked ? 'text-[#94a3b8]' : 'text-[#0b1730]'}`}>{price}</span>
    </button>
  </li>
}

function SearchOverlay({ near, onPick, onClose }: { near: { lat: number; lng: number }; onPick: (place: PlaceSearchResult) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [busy, setBusy] = useState(false)
  const request = useRef(0)
  async function run() {
    if (query.trim().length < 3) return
    const id = ++request.current; setBusy(true)
    const found = await searchPlaces(query, near)
    if (id === request.current) { setResults(found); setBusy(false) }
  }
  return <div className="fixed inset-0 z-[1100] bg-white px-3 pt-[max(.75rem,env(safe-area-inset-top))]">
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-2 rounded-2xl border border-[#e3eaf3] px-3">
        <Search className="h-5 w-5 text-[#1769ff]" />
        <input autoFocus value={query} onChange={e => { request.current++; setQuery(e.target.value) }} onKeyDown={e => { if (e.key === 'Enter') void run() }} placeholder="Where are you going?" className="min-h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        <button onClick={onClose} className="p-1 text-[#64748b]" aria-label="Close search"><X className="h-5 w-5" /></button>
      </div>
      <button onClick={() => void run()} disabled={busy || query.trim().length < 3} className="mt-2 w-full rounded-2xl bg-[#1769ff] py-3 text-sm font-bold text-white disabled:opacity-40">{busy ? 'Searching…' : 'Search'}</button>
      <ul className="mt-2">{results.map((place, i) => <li key={`${place.name}-${i}`}><button onClick={() => onPick(place)} className="block w-full rounded-xl px-3 py-3 text-left hover:bg-[#f5f8ff]"><span className="block text-sm font-semibold">{place.name}</span>{place.address && <span className="block truncate text-xs text-[#64748b]">{place.address}</span>}</button></li>)}</ul>
    </div>
  </div>
}

function SavedMenu({ saved, onSave, onSelect, onChangeArea, onClose }: { saved: SavedLocations; onSave: (kind: SavedPlaceKind) => void; onSelect: (kind: SavedPlaceKind) => void; onChangeArea: () => void; onClose: () => void }) {
  const act = (fn: () => void) => { fn(); onClose() }
  const item = 'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#f5f8ff]'
  return <div className="absolute right-0 top-14 z-[700] w-60 rounded-2xl border border-[#e3eaf3] bg-white p-1.5 shadow-xl">
    {saved.home && <button onClick={() => act(() => onSelect('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#1769ff]" />Home</button>}
    {saved.work && <button onClick={() => act(() => onSelect('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#1769ff]" />Work</button>}
    <button onClick={() => act(() => onSave('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#64748b]" />Save this as home</button>
    <button onClick={() => act(() => onSave('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#64748b]" />Save this as work</button>
    <button onClick={() => act(onChangeArea)} className={item}><span className="flex h-4 w-4 items-center"><BrandMark className="w-4" /></span>Change city</button>
  </div>
}

function ParkingTimerBar({ name, leaveBy, minutesLeft, onEnd }: { name: string; leaveBy: string; minutesLeft: number; onEnd: () => void }) {
  const over = minutesLeft < 0
  const soon = !over && minutesLeft <= 15
  const tone = over ? 'bg-red-50 text-red-700 border-red-200' : soon ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-[#f5f8ff] text-[#0b1730] border-[#dce7f8]'
  const left = over ? `${formatDurationShort(-minutesLeft)} over` : `${formatDurationShort(Math.max(minutesLeft, 0))} left`
  const time = new Date(leaveBy).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })
  return <div role="timer" aria-live="polite" className={`mx-3 mt-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${tone}`}>
    <BellRing className="h-5 w-5 shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold">{left} · leave by {time}</span>
      <span className="block truncate text-xs opacity-80">{name}</span>
    </span>
    <button onClick={onEnd} className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold shadow-sm">I've left</button>
  </div>
}
