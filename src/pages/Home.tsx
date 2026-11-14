import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, BriefcaseBusiness, Check, ChevronDown, Clock3, ChevronRight, CircleDollarSign, HomeIcon, LocateFixed, MapPin, Navigation2, Radio, Search, Star, Ticket, X } from 'lucide-react'
import { OptionSheet } from '../components/OptionSheet'
import { SignPlate, TicketTime, plateLabel, signNotation } from '../components/Kerb'
import { BrandMark, SignMark } from '../components/BrandMark'
import { useNearbyParking } from '../lib/useNearbyParking'
import { isMelbourneSearch } from '../lib/melbourneSensors'
import { searchPlaces, type PlaceSearchResult } from '../lib/geocoding'
import { useClock } from '../lib/useClock'
import { formatCents, formatDurationShort, melbourneStart } from '../lib/parkingCost'
import { carParkOptions, directionsUrl, loadCarParkRates, loadStreetRates, mappedCarParkOptions, sortParkingOptions, splitStreet, streetOptionHere, streetOptions, walkMinutes, type CarParkRatesFile, type ParkingOption, type ParkingSort, type StreetRatesFile } from '../lib/parkingOptions'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'
import { trackEvent } from '../lib/analytics'
import { endParking, startParking, useParkingSession } from '../lib/parkingTimer'
import { setHeading, useHeading, type Heading } from '../lib/heading'
import { DrivingOverlay, ParkedPrompt } from '../components/DrivingMode'
import { haversineMeters } from '../lib/distance'
import { VENUES, type Venue } from '../lib/venues'
import { useFavourites, type FavouritePlace } from '../lib/favourites'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))

const DURATIONS = [30, 60, 120, 180, 240, 540]
/** Fetch a 10-minute walk once; show the 5-minute ring unless it has too few options. */
const NEAR_M = 400
const FAR_M = 800
const MIN_GOOD_OPTIONS = 3
const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631, label: 'Melbourne CBD' }

const DURATION_KEY = 'bay.stay-minutes.v1'
const TIPS_KEY = 'bay.tips-seen.v1'
function readDuration() {
  try { const v = Number(localStorage.getItem(DURATION_KEY)); return DURATIONS.includes(v) ? v : 120 } catch { return 120 }
}
type ArriveIn = number | 'tonight' | 'tomorrow'
/** Arrival as an offset from now. Uses Melbourne wall-clock minutes so 6pm and
 * 9am mean Melbourne time on any device. */
function arrivalTime(now: Date, when: ArriveIn): Date {
  const { minute } = melbourneStart(now)
  const mins = when === 'tonight' ? Math.max(0, 18 * 60 - minute) : when === 'tomorrow' ? 24 * 60 - minute + 9 * 60 : when
  return new Date(now.getTime() + mins * 60_000)
}
const durationLabel = (d: number) => d === 540 ? 'All day' : formatDurationShort(d)
const clock = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })

const knownPriceText = (o: ParkingOption) => o.cents != null ? (o.cents === 0 ? 'Free' : formatCents(o.cents)) : o.range ? `${formatCents(o.range.min)}–${formatCents(o.range.max)}` : null
const priceText = (o: ParkingOption) => knownPriceText(o) ?? 'Check rate'

export function Home({ center, myLocation, driving = false, locationLabel, onUseCurrentLocation, savedLocations, onSavePlace, onSelectSavedPlace }: {
  center: { lat: number; lng: number }; myLocation?: { lat: number; lng: number }; driving?: boolean; locationLabel: string; onUseCurrentLocation: () => void
  savedLocations: SavedLocations; onSavePlace: (kind: SavedPlaceKind) => void; onSelectSavedPlace: (kind: SavedPlaceKind) => void
}) {
  const [duration, setDurationState] = useState(readDuration)
  const setDuration = (d: number) => { setDurationState(d); try { localStorage.setItem(DURATION_KEY, String(d)) } catch { /* private mode */ } }
  const [arriveIn, setArriveIn] = useState<ArriveIn>(0)
  const [sort, setSort] = useState<ParkingSort>('nearest')
  const [whenOpen, setWhenOpen] = useState(false)
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string; note?: string } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [streetRates, setStreetRates] = useState<StreetRatesFile | null>(null)
  const [carParkRates, setCarParkRates] = useState<CarParkRatesFile | null>(null)
  const [rateError, setRateError] = useState(false)
  const [hereMessage, setHereMessage] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  const target = destination ?? center
  const { session: parked, minutesLeft } = useParkingSession()
  const heading = useHeading()
  const [passenger, setPassenger] = useState(false)
  // A new drive resets "I'm a passenger".
  useEffect(() => { if (!driving) setPassenger(false) }, [driving])
  const melbourne = isMelbourneSearch(target.lat, target.lng)
  const now = useClock()
  const { spots, loading: spotsLoading, error: spotsError, updatedAt, refresh: refreshSpots } = useNearbyParking(target, FAR_M)
  const { carParks: mappedAreas, loading: areasLoading, error: areasError, refresh: refreshAreas } = useNearbyCarParks(target, FAR_M, melbourne)
  const loading = spotsLoading || areasLoading
  const parkingError = spotsError ?? areasError
  const refreshParking = () => { refreshSpots(); refreshAreas() }
  const favourites = useFavourites()
  const favIds = useMemo(() => new Set(favourites.map(f => f.id)), [favourites])
  const [showTips, setShowTips] = useState(() => { try { return !localStorage.getItem(TIPS_KEY) } catch { return false } })

  useEffect(() => {
    if (!melbourne) return
    Promise.all([loadStreetRates(), loadCarParkRates()])
      .then(([s, c]) => { setStreetRates(s); setCarParkRates(c); setRateError(false) })
      .catch(() => setRateError(true))
  }, [melbourne, retry])
  useEffect(() => { setSelectedId(null); setHereMessage(null) }, [target.lat, target.lng])

  const arrival = useMemo(() => arrivalTime(now, arriveIn), [now, arriveIn])
  const later = arrival.getTime() - now.getTime() > 5 * 60_000
  const start = useMemo(() => melbourneStart(arrival), [arrival])
  const allOptions = useMemo(() => {
    if (!melbourne) return []
    const streets = streetOptions(spots, streetRates, start, duration, now)
    const curated = carParkOptions(carParkRates, target, FAR_M, start, duration, now)
    const mapped = mappedCarParkOptions(mappedAreas, duration).filter(area => !curated.some(known =>
      haversineMeters(area, known) <= 20 && area.name.toLowerCase() === known.name.toLowerCase()))
    return [...streets, ...curated, ...mapped]
  }, [melbourne, spots, streetRates, carParkRates, mappedAreas, start, duration, now, target])
  const { options, radius } = useMemo(() => {
    const near = allOptions.filter(o => o.distanceM <= NEAR_M)
    const good = (list: ParkingOption[]) => list.filter(o => o.fits !== false).length
    return good(near) >= MIN_GOOD_OPTIONS ? { options: near, radius: NEAR_M } : { options: allOptions, radius: FAR_M }
  }, [allOptions])
  const orderedOptions = useMemo(() => sortParkingOptions(options, sort), [options, sort])
  const fitting = orderedOptions.filter(o => o.fits !== false)
  const notSuitable = orderedOptions.filter(o => o.fits === false)
  const best = fitting[0]
  const others = fitting.slice(1)
  const selected = allOptions.find(o => o.id === selectedId) ?? null
  /** Every nearby place stays visible. Compact availability markers keep the
   * map readable without hiding places behind an arbitrary result cap. */
  const mapOptions = useMemo(() => sortParkingOptions(options, 'nearest'), [options])

  /** Remember where the driver is going so Bay can offer the timer on arrival. */
  function goTo(option: ParkingOption) {
    const nav = option.navTo ?? option
    setHeading({ id: option.id, name: option.kind === 'street' ? splitStreet(option.name).title : option.name, kind: option.kind, lat: option.lat, lng: option.lng, navLat: nav.lat, navLng: nav.lng,
      cents: option.cents, durationMinutes: duration, limitMinutes: option.limitMinutes, setAt: Date.now() })
    trackEvent('directions_open', { result_type: option.kind })
  }
  const nearHeading = !!heading && !!myLocation && haversineMeters(myLocation, heading) <= 150
  const showParkedPrompt = !!heading && !parked && !driving && nearHeading
  async function startFromHeading(h: Heading) {
    const now = new Date()
    const stay = h.limitMinutes != null ? Math.min(h.durationMinutes, h.limitMinutes) : h.durationMinutes
    await startParking({ name: h.name, lat: h.lat, lng: h.lng, kind: h.kind, startedAt: now.toISOString(), leaveBy: new Date(now.getTime() + stay * 60_000).toISOString(),
      limitAt: h.limitMinutes != null ? new Date(now.getTime() + h.limitMinutes * 60_000).toISOString() : undefined, cents: h.cents })
    setHeading(null)
  }
  function pick(option: ParkingOption) { setSelectedId(option.id); trackEvent('parking_result_view', { result_type: option.kind }) }
  function goToVenue(venue: Venue) {
    setDestination({ lat: venue.lat, lng: venue.lng, label: venue.name, note: venue.note })
    setDuration(DURATIONS.includes(venue.minutes) ? venue.minutes : 240)
    setSearchOpen(false)
  }
  function canIParkHere() {
    setDestination(null)
    setArriveIn(0)
    const found = streetOptionHere(allOptions, myLocation ?? center)
    if (found) { setHereMessage(null); pick(found.option) }
    else setHereMessage(myLocation ? 'No council bay within 40 m of you. Check the sign where you are.' : 'Turn on location so Bay can find the bay next to you.')
  }

  return <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-transparent antialiased">
    <div className="bay-home-map relative min-h-0 flex-1">
      <Suspense fallback={<div className="h-full bg-tint-2" />}>
        <MapView center={target} myLocation={myLocation} zoom={radius === NEAR_M ? 17 : 16}
          spots={[]}
          options={mapOptions} selectedOptionId={selectedId} onSelectOption={pick} />
      </Suspense>

      {/* Top: where + how long, one card */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-3 pt-[max(.75rem,env(safe-area-inset-top))] lg:right-[430px]">
        <div className="pointer-events-auto mx-auto max-w-xl rounded-[24px] glass p-1.5">
          <div className="flex items-center gap-1">
            <BrandMark size="sm" className="ml-2 mr-1 shrink-0" />
            <span aria-hidden className="h-7 w-px shrink-0 bg-line" />
            <button onClick={() => setSearchOpen(true)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 text-left transition-colors hover:bg-tint" aria-label="Where are you going?">
              <Search className="h-5 w-5 shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-ink-3">{destination ? 'Parking near' : 'Where to?'}</span>
                <span className="block truncate text-[15px] font-semibold text-ink">{destination ? destination.label : /current location/i.test(locationLabel) ? 'Near you' : `Near ${locationLabel}`}</span>
              </span>
            </button>
            {melbourne && <div className="relative">
              <button onClick={() => setWhenOpen(v => !v)} aria-expanded={whenOpen} aria-label={`Arriving ${later ? clock(arrival) : 'now'}. Change arrival time`}
                className={`flex h-11 items-center gap-1 rounded-[16px] px-3 text-sm font-bold tabular-nums transition-colors ${later ? 'bg-tint-2 text-brand' : 'text-ink-2 hover:bg-tint'}`}>
                <Clock3 className="h-4 w-4" />{later ? clock(arrival).replace(':00', '') : 'Now'}<ChevronDown className="h-3.5 w-3.5" />
              </button>
              {whenOpen && <WhenMenu value={arriveIn} now={now} onPick={v => { setArriveIn(v); setWhenOpen(false) }} onClose={() => setWhenOpen(false)} />}
            </div>}
            {destination
              ? <button onClick={() => setDestination(null)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-ink-3 hover:bg-tint" aria-label="Back to near me"><X className="h-5 w-5" /></button>
              : <div className="relative">
                <button onClick={() => setSavedOpen(v => !v)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-ink-2 hover:bg-tint" aria-label="Saved places" aria-expanded={savedOpen}><Bookmark className="h-5 w-5" /></button>
                {savedOpen && <SavedMenu saved={savedLocations} onSave={onSavePlace} onSelect={onSelectSavedPlace} onClose={() => setSavedOpen(false)} />}
              </div>}
          </div>
          {melbourne && <div className="mt-1 border-t border-line px-1 pt-1.5">
            {/* Plain stay labels: drivers should not need to decode sign notation. */}
            <div className="flex items-stretch gap-1.5 px-1 pb-1 pt-1.5" role="radiogroup" aria-label="How long are you staying?">
              {DURATIONS.map(d => <button key={d} role="radio" aria-checked={duration === d} aria-label={durationLabel(d)} onClick={() => setDuration(d)}
                className={`h-11 min-w-0 flex-1 rounded-[7px] transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.96] ${duration === d
                  ? 'bg-sel text-sel-ink shadow-[0_6px_14px_rgba(22,131,247,.24)]'
                  : 'bg-white text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]'}`}>
                <span className="text-[10px] font-bold sm:text-xs">{durationLabel(d)}</span>
              </button>)}
            </div>
          </div>}
        </div>
      </header>

      {melbourne && <div className="pointer-events-none absolute left-3 top-[136px] z-[420] flex items-center gap-3 rounded-full glass px-3 py-2 text-[10px] font-semibold text-ink-2 lg:top-[92px]" aria-label="Map availability legend">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#16A34A]" />Available now</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#DC2626]" />Full now</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1683F7]" />Check on arrival</span>
      </div>}

      {/* Bottom sheet: the answer first */}
      <section className={`absolute inset-x-0 bottom-0 z-[450] mx-auto flex max-w-xl flex-col rounded-t-[28px] glass transition-[max-height] duration-300 lg:inset-y-3 lg:left-auto lg:right-3 lg:w-[410px] lg:max-h-none lg:rounded-[28px] ${expanded ? 'max-h-[78%]' : 'max-h-[44%]'}`}>
        {/* Floating actions ride on top of the sheet */}
        <div className={`pointer-events-none absolute -top-[60px] right-3 flex items-center gap-2 transition-opacity duration-200 ${expanded ? 'opacity-0 [&>*]:pointer-events-none' : 'opacity-100'}`} aria-hidden={expanded}>
          {melbourne && <button tabIndex={expanded ? -1 : 0} onClick={canIParkHere} className="pointer-events-auto flex h-12 items-center gap-2 rounded-full glass pl-3.5 pr-4 text-sm font-bold text-ink transition-transform active:scale-[0.97]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full selected-pill text-white"><MapPin className="h-3.5 w-3.5" /></span>Can I park here?
          </button>}
          <button tabIndex={expanded ? -1 : 0} onClick={() => { setDestination(null); onUseCurrentLocation() }} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full glass text-brand transition-transform active:scale-[0.97]" aria-label="Centre on my location"><LocateFixed className="h-5 w-5" /></button>
        </div>

        {parked && minutesLeft != null && <div className="px-3 pt-3"><ParkingTimerBar name={parked.name} lat={parked.lat} lng={parked.lng} leaveBy={parked.leaveBy} minutesLeft={minutesLeft} onEnd={() => void endParking()} /></div>}
        <button onClick={() => setExpanded(v => !v)} className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200" aria-label={expanded ? 'Show less' : 'Show more'} />
        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-ink [text-wrap:balance]">{melbourne ? sort === 'cheapest' ? `Lowest total for ${duration === 540 ? 'the day' : durationLabel(duration)}` : sort === 'available' ? 'Available now' : 'Nearest parking' : 'Parking nearby'}</h2>
            <p className="text-xs text-ink-3">{loading ? 'Finding parking…' : melbourne ? fitting.length === 0 ? 'Nothing nearby fits this stay' : `${fitting.length} place${fitting.length === 1 ? '' : 's'} within a ${walkMinutes(radius)} min walk${later ? ` · arriving ${clock(arrival)}` : ''}` : 'Outside Melbourne'}</p>
          </div>
          {melbourne && (others.length > 2 || notSuitable.length > 0) && <button onClick={() => setExpanded(v => !v)} className="shrink-0 rounded-full px-3 py-2 text-sm font-bold text-brand hover:bg-tint">{expanded ? 'Less' : 'See all'}</button>}
        </div>

        {melbourne && <SortBar value={sort} onChange={setSort} />}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {hereMessage && <p role="status" className="mx-2 mb-2 rounded-2xl bg-tint px-3 py-2.5 text-sm text-ink-2">{hereMessage}</p>}
          {destination?.note && <p className="mx-2 mb-2 flex gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900"><Ticket className="h-4 w-4 shrink-0" />{destination.note}</p>}
          {rateError && <div role="alert" className="mx-2 mb-2 flex items-center gap-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><span className="min-w-0 flex-1">Rate details couldn't load. Check your connection and try again.</span><button onClick={() => setRetry(n => n + 1)} className="h-10 shrink-0 rounded-[12px] bg-surface px-3 font-bold text-amber-900">Retry</button></div>}
          {parkingError && <div role="alert" className="mx-2 mb-2 flex items-center gap-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><span className="min-w-0 flex-1">{parkingError}</span><button onClick={() => refreshParking()} className="h-10 shrink-0 rounded-[12px] bg-white px-3 font-bold text-amber-900">Retry</button></div>}

          {melbourne && <>
            {loading && !best && <SkeletonRows />}
            {!loading && !best && <p className="px-2 py-3 text-sm text-ink-2">Nothing within a {walkMinutes(FAR_M)} min walk fits {durationLabel(duration).toLowerCase()}. Try a shorter stay.</p>}
            {showParkedPrompt && heading && <ParkedPrompt heading={heading} onStart={() => void startFromHeading(heading)} onDismiss={() => setHeading(null)} />}
            {showTips && !showParkedPrompt && best && <div className="bay-rise mb-2 flex items-center gap-3 rounded-2xl bg-night px-3.5 py-2.5 text-white">
              <SignMark className="h-7 w-7 shrink-0" />
              <p className="min-w-0 flex-1 text-[13px] leading-5">Choose your stay, then compare nearest, cheapest or live availability.</p>
              <button onClick={() => { setShowTips(false); try { localStorage.setItem(TIPS_KEY, '1') } catch { /* ignore */ } }} className="h-10 shrink-0 rounded-[12px] bg-white/15 px-3 text-xs font-bold">Got it</button>
            </div>}
            <div key={`${duration}-${String(arriveIn)}`}>
            {best && <BestCard option={best} duration={duration} at={arrival} later={later} starred={favIds.has(best.id)} onGo={() => goTo(best)} onOpen={() => pick(best)} />}
            {others.length > 0 && <ul className="mt-3 px-1">{(expanded ? others : others.slice(0, 2)).map(o => <OptionRow key={o.id} option={o} at={arrival} later={later} starred={favIds.has(o.id)} onClick={() => pick(o)} />)}</ul>}
            </div>
            {expanded && notSuitable.length > 0 && <Group title={`Not suitable for ${durationLabel(duration).toLowerCase()} (${notSuitable.length})`} hint="The time limit is too short"><ul>{notSuitable.map(o => <OptionRow key={o.id} option={o} at={arrival} later={later} starred={favIds.has(o.id)} onClick={() => pick(o)} />)}</ul></Group>}
            {!later && updatedAt && fitting.some(o => o.live) && <p className="mt-3 px-2 text-xs text-ink-3">Free bays from City of Melbourne sensors · updated {clock(updatedAt)}</p>}
          </>}

          {!melbourne && <div className="px-2 py-3">
            <p className="text-sm text-ink-2">Bay covers Melbourne for now. Search for a place in Melbourne, or jump to the CBD.</p>
            <button onClick={() => setDestination(MELBOURNE_CBD)} className="mt-3 h-12 w-full rounded-[16px] cta text-sm font-bold text-white transition-transform active:scale-[0.98]">Show parking in Melbourne CBD</button>
          </div>}
        </div>
      </section>
    </div>

    {searchOpen && <SearchOverlay saved={favourites} onSaved={f => { setDestination({ lat: f.lat, lng: f.lng, label: f.name }); setSearchOpen(false) }} onClose={() => setSearchOpen(false)} onVenue={goToVenue}
      onPick={place => { trackEvent('parking_search', { result_source: 'geocoder' }); setDestination({ lat: place.lat, lng: place.lng, label: place.name }); setSearchOpen(false) }} />}
    {driving && !passenger && <DrivingOverlay target={heading ? { name: heading.name, lat: heading.navLat, lng: heading.navLng } : best ? { name: best.kind === 'street' ? splitStreet(best.name).title : best.name, lat: (best.navTo ?? best).lat, lng: (best.navTo ?? best).lng } : null} onPassenger={() => setPassenger(true)} />}
    <OptionSheet key={selected?.id ?? 'none'} onGo={goTo} option={selected} durationMinutes={duration} arrival={arrival} later={later} onClose={() => setSelectedId(null)} />
  </main>
}

function OptionTitle({ option, starred, size = 'md' }: { option: ParkingOption; starred?: boolean; size?: 'md' | 'lg' }) {
  const title = option.kind === 'carpark' ? option.name : splitStreet(option.name).title
  return <span className={`flex items-center gap-1 font-extrabold tracking-[-.01em] text-ink ${size === 'lg' ? 'text-[21px] leading-6' : 'text-[16px] leading-5'}`}><span className="truncate">{title}</span>{starred && <Star className="h-3.5 w-3.5 shrink-0 text-brand" fill="currentColor" aria-label="Saved" />}</span>
}

/** Under the name: where it is and how far, then live bays if we have them.
 * The time limit and meter are on the sign plate, so they're not repeated. */
function Facts({ option, at, later }: { option: ParkingOption; at: Date; later: boolean }) {
  const where = option.kind === 'carpark' ? option.operator ?? 'Car park' : splitStreet(option.name).block?.replace(/^Between /, '').replace(' and ', '–')
  const live = option.live && !later ? option.live : null
  const oddLimit = option.limitMinutes != null && signNotation(option.limitMinutes) == null
  const priceKind = option.cents === 0 ? 'Free parking' : knownPriceText(option) ? 'Paid parking' : 'Check rate at location'
  return <span className="mt-1 grid gap-0.5 text-[12px] leading-[17px] text-ink-2">
    <span className="flex min-w-0 flex-wrap gap-x-2"><span className="whitespace-nowrap">{walkMinutes(option.distanceM)} min walk</span>{where && <span className="min-w-0 truncate">{where}</span>}</span>
    <span className="flex flex-wrap gap-x-2"><span className="font-semibold">{priceKind}</span>{oddLimit && <span className="whitespace-nowrap">Stay until {clock(new Date(at.getTime() + option.limitMinutes! * 60_000))}</span>}</span>
    {live && live.free > 0
      ? <span className="whitespace-nowrap font-bold text-ok"><span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-full bg-[#16A34A]" />{live.free} live bays available</span>
      : live
        ? <span className="whitespace-nowrap font-bold text-[#DC2626]"><span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-full bg-[#DC2626]" />Full now</span>
        : <span className="whitespace-nowrap text-brand"><span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1683F7]" />Check availability on arrival</span>}
  </span>
}

/** The best option, as the pay-and-display ticket you'd get for it. */
function BestCard({ option, duration, at, later, starred, onGo, onOpen }: { option: ParkingOption; duration: number; at: Date; later: boolean; starred?: boolean; onGo: () => void; onOpen: () => void }) {
  const leave = option.limitMinutes != null && option.limitMinutes < duration ? option.limitMinutes : duration
  return <div className="ticket bay-print text-ink">
    <button onClick={onOpen} className="flex w-full items-start gap-3 px-4 pb-5 pt-4 text-left" aria-label={`${option.name}, ${plateLabel(option)}, details`}>
      <SignPlate option={option} size="lg" />
      <span className="min-w-0 flex-1 pt-0.5"><OptionTitle option={option} starred={starred} size="lg" /><Facts option={option} at={at} later={later} /></span>
      <span className="shrink-0 text-right">
        <span className={`figure block leading-[.95] text-ink ${knownPriceText(option) ? 'text-[40px]' : 'max-w-28 text-[15px]'}`}>{priceText(option)}</span>
        <span className="mt-1 block text-xs text-ink-3">for {formatDurationShort(duration)}</span>
      </span>
    </button>
    <span aria-hidden className="ticket-tear" />
    <div className="flex h-[80px] items-center gap-3 px-4">
      <span className="min-w-0 flex-1"><span className="block text-xs text-ink-3">Leave by</span><TicketTime className="block text-[26px] leading-7 text-ink" date={new Date(at.getTime() + leave * 60_000)} /></span>
      <a href={directionsUrl(option.navTo?.lat ?? option.lat, option.navTo?.lng ?? option.lng)} target="_blank" rel="noreferrer" onClick={onGo}
        className="go-cta flex h-14 shrink-0 items-center gap-2 rounded-full px-7 text-[17px] font-extrabold transition-transform active:scale-[0.97]"><Navigation2 className="h-5 w-5" />Go</a>
    </div>
  </div>
}

function OptionRow({ option, at, later, starred, onClick }: { option: ParkingOption; at: Date; later: boolean; starred?: boolean; onClick: () => void }) {
  const price = option.fits === false ? null : priceText(option)
  return <li className="border-b border-line last:border-b-0">
    <button onClick={onClick} aria-label={`${option.name}, ${plateLabel(option)}`} className="flex min-h-[68px] w-full items-center gap-3 px-1 py-2.5 text-left">
      <SignPlate option={option} />
      <span className="min-w-0 flex-1"><OptionTitle option={option} starred={starred} /><Facts option={option} at={at} later={later} /></span>
      <span className={`figure max-w-24 shrink-0 text-right text-ink ${knownPriceText(option) ? 'text-[20px]' : 'text-[12px] leading-4'}`}>{price ?? <span className="text-sm font-semibold text-ink-3">Too short</span>}</span>
    </button>
  </li>
}

function SortBar({ value, onChange }: { value: ParkingSort; onChange: (sort: ParkingSort) => void }) {
  const choices: { value: ParkingSort; label: string; icon: typeof MapPin }[] = [
    { value: 'nearest', label: 'Nearest', icon: MapPin },
    { value: 'cheapest', label: 'Cheapest', icon: CircleDollarSign },
    { value: 'available', label: 'Available', icon: Radio },
  ]
  return <div className="mx-4 mb-2 grid grid-cols-3 gap-1 rounded-[16px] bg-tint p-1" role="radiogroup" aria-label="Sort parking results">
    {choices.map(choice => { const Icon = choice.icon; const selected = value === choice.value; return <button key={choice.value} role="radio" aria-checked={selected} onClick={() => onChange(choice.value)} className={`flex min-h-11 items-center justify-center gap-1 rounded-[12px] px-1 text-[11px] font-bold transition-colors ${selected ? 'bg-white text-brand shadow-sm' : 'text-ink-3 hover:text-ink'}`}><Icon className="h-3.5 w-3.5" />{choice.label}</button> })}
  </div>
}

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="mt-2 border-t border-line pt-2">
    <button onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-2 text-left hover:bg-tint">
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink-2">{title}</span><span className="block text-xs text-ink-3">{hint}</span></span>
      <ChevronDown className={`h-5 w-5 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && children}
  </div>
}

function SkeletonRows() {
  return <div aria-hidden className="space-y-2 px-1">
    <div className="h-[132px] animate-pulse rounded-[22px] bg-tint" />
    <div className="h-14 animate-pulse rounded-2xl bg-tint" />
  </div>
}

/** The ticket on the dash: when it expires, how long is left. */
function ParkingTimerBar({ name, lat, lng, leaveBy, minutesLeft, onEnd }: { name: string; lat: number; lng: number; leaveBy: string; minutesLeft: number; onEnd: () => void }) {
  const over = minutesLeft < 0
  const soon = !over && minutesLeft <= 15
  const left = over ? `${formatDurationShort(-minutesLeft)} over` : `${formatDurationShort(Math.max(minutesLeft, 0))} left`
  return <div role="timer" aria-live="polite" className={`bay-rise flex items-center gap-3 rounded-[16px] bg-white py-2.5 pl-3 pr-2 text-[#102c40] shadow-[0_10px_28px_rgba(16,44,64,.2)] ${over ? 'ring-[3px] ring-[#dbff00]' : soon ? 'ring-[3px] ring-[#dbff00]' : ''}`}>
    <span className="min-w-0 flex-1">
      <span className="block text-[11px] text-[#5c7183]">Expires</span>
      <TicketTime className="block text-[22px] leading-6" date={new Date(leaveBy)} />
      <span className={`block truncate text-xs ${over || soon ? 'font-bold text-[#102c40] underline decoration-[#dbff00] decoration-[3px] underline-offset-2' : 'text-[#3e5568]'}`}>{left}, {name}</span>
    </span>
    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`} target="_blank" rel="noreferrer" className="flex h-11 shrink-0 items-center rounded-full bg-[#dbff00] px-3.5 text-xs font-extrabold text-[#102c40] transition-transform active:scale-[0.97]">Find car</a>
    <button onClick={onEnd} className="h-11 shrink-0 rounded-full px-3 text-xs font-bold text-[#3e5568] transition-transform active:scale-[0.97]">I've left</button>
  </div>
}

function SearchOverlay({ saved, onSaved, onPick, onVenue, onClose }: { saved: FavouritePlace[]; onSaved: (f: FavouritePlace) => void; onPick: (place: PlaceSearchResult) => void; onVenue: (venue: Venue) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const request = useRef(0)
  async function run() {
    if (query.trim().length < 3) return
    const id = ++request.current; setBusy(true)
    const found = await searchPlaces(query).catch(() => [])
    if (id === request.current) { setResults(found); setBusy(false); setSearched(true) }
  }
  return <div className="bay-fade fixed inset-0 z-[1100] overflow-y-auto glass glass-strong px-3 pb-8 pt-[max(.75rem,env(safe-area-inset-top))]">
    <div className="mx-auto max-w-xl">
      <form onSubmit={e => { e.preventDefault(); void run() }} className="flex items-center gap-2 rounded-[20px] bg-tint pl-3.5 pr-1.5 shadow-[inset_0_0_0_1px_var(--line)] focus-within:shadow-[inset_0_0_0_2px_var(--brand)]">
        <Search className="h-5 w-5 shrink-0 text-brand" />
        <input autoFocus enterKeyHint="search" value={query} onChange={e => { request.current++; setQuery(e.target.value); setSearched(false) }} placeholder="Where in Melbourne?" aria-label="Where are you going?" className="min-h-[52px] min-w-0 flex-1 bg-transparent text-base text-ink outline-none focus:outline-none focus-visible:outline-none placeholder:text-ink-3" />
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[14px] text-ink-3" aria-label="Close"><X className="h-5 w-5" /></button>
      </form>
      {query.trim().length >= 3 && <button onClick={() => void run()} disabled={busy} className="mt-2 h-12 w-full rounded-[18px] cta text-sm font-bold text-white transition-transform active:scale-[0.99] disabled:opacity-60">{busy ? 'Searching…' : `Search “${query.trim()}”`}</button>}
      {results.length > 0 && <ul className="mt-3">{results.map((place, i) => <li key={`${place.name}-${i}`}><button onClick={() => onPick(place)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-tint"><MapPin className="h-5 w-5 shrink-0 text-brand" /><span className="min-w-0"><span className="block text-[15px] font-semibold text-ink">{place.name}</span>{place.address && <span className="block truncate text-xs text-ink-3">{place.address}</span>}</span></button></li>)}</ul>}
      {searched && !busy && results.length === 0 && <p className="mt-3 px-2 text-sm text-ink-2">No places found. Try a street name or landmark.</p>}
      {!query && <>
        {saved.length > 0 && <>
          <p className="mt-5 px-2 text-xs font-semibold text-ink-3">Your saved spots</p>
          <ul className="mt-1">{saved.slice(0, 6).map(f => <li key={f.id}><button onClick={() => onSaved(f)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-tint">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-amber-50 text-amber-500"><Star className="h-5 w-5" fill="currentColor" /></span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{f.name}</span>
            <ChevronRight className="h-5 w-5 text-ink-3" />
          </button></li>)}</ul>
        </>}
        <p className="mt-5 px-2 text-xs font-semibold text-ink-3">Going to an event?</p>
        <ul className="mt-1">{VENUES.map(v => <li key={v.id}><button onClick={() => onVenue(v)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-tint">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-tint-2 text-brand"><Ticket className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-ink">{v.name}</span><span className="block text-xs text-ink-3">Shows parking for {durationLabel(v.minutes).toLowerCase()}</span></span>
          <ChevronRight className="h-5 w-5 text-ink-3" />
        </button></li>)}</ul>
      </>}
    </div>
  </div>
}

function WhenMenu({ value, now, onPick, onClose }: { value: ArriveIn; now: Date; onPick: (v: ArriveIn) => void; onClose: () => void }) {
  const { minute } = melbourneStart(now)
  const choices: { v: ArriveIn; label: string }[] = [
    { v: 0, label: 'Now' }, { v: 30, label: 'In 30 min' }, { v: 60, label: 'In 1 hr' }, { v: 120, label: 'In 2 hrs' },
    ...(minute < 17 * 60 ? [{ v: 'tonight' as const, label: 'Tonight, 6 pm' }] : []),
    { v: 'tomorrow', label: 'Tomorrow, 9 am' },
  ]
  return <>
    <button aria-label="Close" className="fixed inset-0 z-[690] cursor-default" onClick={onClose} />
    <div role="menu" aria-label="When are you arriving?" className="bay-menu absolute right-0 top-12 z-[700] w-52 rounded-[20px] glass p-1.5">
      <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-3">Arriving</p>
      {choices.map(c => <button key={String(c.v)} role="menuitemradio" aria-checked={value === c.v} onClick={() => onPick(c.v)}
        className={`flex min-h-11 w-full items-center justify-between rounded-[14px] px-3 text-left text-sm font-semibold hover:bg-tint ${value === c.v ? 'text-brand' : 'text-ink'}`}>
        {c.label}{value === c.v && <Check className="h-4 w-4" />}
      </button>)}
    </div>
  </>
}

function SavedMenu({ saved, onSave, onSelect, onClose }: { saved: SavedLocations; onSave: (kind: SavedPlaceKind) => void; onSelect: (kind: SavedPlaceKind) => void; onClose: () => void }) {
  const act = (fn: () => void) => { fn(); onClose() }
  const item = 'flex min-h-11 w-full items-center gap-2.5 rounded-[14px] px-3 text-left text-sm font-semibold text-ink hover:bg-tint'
  return <div className="bay-menu absolute right-0 top-12 z-[700] w-60 rounded-[20px] glass p-1.5">
    {saved.home && <button onClick={() => act(() => onSelect('home'))} className={item}><HomeIcon className="h-4 w-4 text-brand" />Home</button>}
    {saved.work && <button onClick={() => act(() => onSelect('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-brand" />Work</button>}
    <button onClick={() => act(() => onSave('home'))} className={item}><HomeIcon className="h-4 w-4 text-ink-3" />Save this as home</button>
    <button onClick={() => act(() => onSave('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-ink-3" />Save this as work</button>
  </div>
}
