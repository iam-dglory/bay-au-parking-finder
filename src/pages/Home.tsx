import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Bookmark, BriefcaseBusiness, CarFront, Check, ChevronDown, Clock3, ChevronRight, HomeIcon, LocateFixed, MapPin, Navigation2, Search, Star, Ticket, X } from 'lucide-react'
import { OptionSheet } from '../components/OptionSheet'
import { SignMark } from '../components/BrandMark'
import { useNearbyParking } from '../lib/useNearbyParking'
import { isMelbourneSearch } from '../lib/melbourneSensors'
import { searchPlaces, type PlaceSearchResult } from '../lib/geocoding'
import { useClock } from '../lib/useClock'
import { formatCents, formatDurationShort, melbourneStart } from '../lib/parkingCost'
import { carParkOptions, directionsUrl, loadCarParkRates, loadStreetRates, rankOptions, splitStreet, streetOptionHere, streetOptions, walkMinutes, type CarParkRatesFile, type ParkingOption, type StreetRatesFile } from '../lib/parkingOptions'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'
import { trackEvent } from '../lib/analytics'
import { endParking, useParkingSession } from '../lib/parkingTimer'
import { VENUES, type Venue } from '../lib/venues'
import { useFavourites, type FavouritePlace } from '../lib/favourites'

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

const priceText = (o: ParkingOption) => o.cents != null ? (o.cents === 0 ? 'Free' : formatCents(o.cents)) : o.range ? `${formatCents(o.range.min)}–${formatCents(o.range.max)}` : null

export function Home({ center, myLocation, locationLabel, onUseCurrentLocation, savedLocations, onSavePlace, onSelectSavedPlace }: {
  center: { lat: number; lng: number }; myLocation?: { lat: number; lng: number }; locationLabel: string; onUseCurrentLocation: () => void
  savedLocations: SavedLocations; onSavePlace: (kind: SavedPlaceKind) => void; onSelectSavedPlace: (kind: SavedPlaceKind) => void
}) {
  const [duration, setDurationState] = useState(readDuration)
  const setDuration = (d: number) => { setDurationState(d); try { localStorage.setItem(DURATION_KEY, String(d)) } catch { /* private mode */ } }
  const [arriveIn, setArriveIn] = useState<ArriveIn>(0)
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
  const melbourne = isMelbourneSearch(target.lat, target.lng)
  const now = useClock()
  const { spots, loading, updatedAt } = useNearbyParking(target, FAR_M)
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
  const notSuitable = [...tooShort, ...unpriced]
  const best = fitting[0]
  const others = fitting.slice(1)
  const selected = allOptions.find(o => o.id === selectedId) ?? null

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

  return <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white antialiased">
    <div className="relative min-h-0 flex-1">
      <Suspense fallback={<div className="h-full bg-[#eef4ff]" />}>
        <MapView center={target} myLocation={myLocation} zoom={radius === NEAR_M ? 17 : 16}
          spots={[]}
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
            {melbourne && <div className="relative">
              <button onClick={() => setWhenOpen(v => !v)} aria-expanded={whenOpen} aria-label={`Arriving ${later ? clock(arrival) : 'now'}. Change arrival time`}
                className={`flex h-11 items-center gap-1 rounded-[16px] px-3 text-sm font-bold tabular-nums transition-colors ${later ? 'bg-[#eef4ff] text-[#1769ff]' : 'text-[#40516d] hover:bg-[#f5f8ff]'}`}>
                <Clock3 className="h-4 w-4" />{later ? clock(arrival).replace(':00', '') : 'Now'}<ChevronDown className="h-3.5 w-3.5" />
              </button>
              {whenOpen && <WhenMenu value={arriveIn} now={now} onPick={v => { setArriveIn(v); setWhenOpen(false) }} onClose={() => setWhenOpen(false)} />}
            </div>}
            {destination
              ? <button onClick={() => setDestination(null)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-[#64748b] hover:bg-[#f5f8ff]" aria-label="Back to near me"><X className="h-5 w-5" /></button>
              : <div className="relative">
                <button onClick={() => setSavedOpen(v => !v)} className="flex h-11 w-11 items-center justify-center rounded-[16px] text-[#40516d] hover:bg-[#f5f8ff]" aria-label="Saved places" aria-expanded={savedOpen}><Bookmark className="h-5 w-5" /></button>
                {savedOpen && <SavedMenu saved={savedLocations} onSave={onSavePlace} onSelect={onSelectSavedPlace} onClose={() => setSavedOpen(false)} />}
              </div>}
          </div>
          {melbourne && <div className="mt-1 border-t border-[#eef2f7] px-1 pt-1.5">
            <div className="relative flex items-center gap-0.5" role="radiogroup" aria-label="How long are you staying?">
              {/* One pill slides to the chosen stay instead of chips flashing on and off. */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 rounded-[14px] bg-[#1769ff] shadow-[0_4px_12px_rgba(23,105,255,.35)] transition-transform duration-300 [transition-timing-function:var(--ease-out)]"
                style={{ width: `calc((100% - ${(DURATIONS.length - 1) * 2}px) / ${DURATIONS.length})`, transform: `translateX(calc(${DURATIONS.indexOf(duration)} * (100% + 2px)))` }} />
              {DURATIONS.map(d => <button key={d} role="radio" aria-checked={duration === d} onClick={() => setDuration(d)}
                className={`relative h-11 min-w-0 flex-1 whitespace-nowrap rounded-[14px] px-1 text-[13px] font-bold tabular-nums transition-colors duration-200 active:scale-[0.97] ${duration === d ? 'text-white' : 'text-[#40516d] hover:bg-[#f5f8ff]'}`}>{durationLabel(d)}</button>)}
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

        {parked && minutesLeft != null && <div className="px-3 pt-3"><ParkingTimerBar name={parked.name} lat={parked.lat} lng={parked.lng} leaveBy={parked.leaveBy} minutesLeft={minutesLeft} onEnd={() => void endParking()} /></div>}
        <button onClick={() => setExpanded(v => !v)} className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200" aria-label={expanded ? 'Show less' : 'Show more'} />
        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-[#0b1730] [text-wrap:balance]">{melbourne ? `Cheapest for ${duration === 540 ? 'the day' : durationLabel(duration)}` : 'Parking nearby'}</h2>
            <p className="text-xs text-[#64748b]">{loading ? 'Finding parking…' : melbourne ? fitting.length === 0 ? 'Nothing nearby fits this stay' : `${fitting.length} place${fitting.length === 1 ? '' : 's'} within a ${walkMinutes(radius)} min walk${later ? ` · arriving ${clock(arrival)}` : ''}` : 'Outside Melbourne'}</p>
          </div>
          {melbourne && (others.length > 2 || notSuitable.length > 0) && <button onClick={() => setExpanded(v => !v)} className="shrink-0 rounded-full px-3 py-2 text-sm font-bold text-[#1769ff] hover:bg-[#f5f8ff]">{expanded ? 'Less' : 'See all'}</button>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {hereMessage && <p role="status" className="mx-2 mb-2 rounded-2xl bg-[#f5f8ff] px-3 py-2.5 text-sm text-[#40516d]">{hereMessage}</p>}
          {destination?.note && <p className="mx-2 mb-2 flex gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900"><Ticket className="h-4 w-4 shrink-0" />{destination.note}</p>}
          {rateError && <div role="alert" className="mx-2 mb-2 flex items-center gap-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><span className="min-w-0 flex-1">Prices couldn't load. Check your connection and try again.</span><button onClick={() => setRetry(n => n + 1)} className="h-10 shrink-0 rounded-[12px] bg-white px-3 font-bold text-amber-900">Retry</button></div>}

          {melbourne && <>
            {loading && !best && <SkeletonRows />}
            {!loading && !best && <p className="px-2 py-3 text-sm text-[#40516d]">Nothing within a {walkMinutes(FAR_M)} min walk fits {durationLabel(duration).toLowerCase()}. Try a shorter stay.</p>}
            {showTips && best && <div className="bay-rise mb-2 flex items-center gap-3 rounded-2xl bg-[#07152f] px-3.5 py-2.5 text-white">
              <SignMark className="h-7 w-7 shrink-0" />
              <p className="min-w-0 flex-1 text-[13px] leading-5">Pick how long you're staying. Bay finds the cheapest place that allows it.</p>
              <button onClick={() => { setShowTips(false); try { localStorage.setItem(TIPS_KEY, '1') } catch { /* ignore */ } }} className="h-10 shrink-0 rounded-[12px] bg-white/15 px-3 text-xs font-bold">Got it</button>
            </div>}
            <div key={`${duration}-${String(arriveIn)}`} className="bay-stagger">
            {best && <BestCard option={best} duration={duration} at={arrival} later={later} starred={favIds.has(best.id)} onOpen={() => pick(best)} />}
            {others.length > 0 && <ul className="mt-1 bay-stagger">{(expanded ? others : others.slice(0, 2)).map(o => <OptionRow key={o.id} option={o} at={arrival} later={later} starred={favIds.has(o.id)} onClick={() => pick(o)} />)}</ul>}
            </div>
            {expanded && notSuitable.length > 0 && <Group title={`Not suitable for ${durationLabel(duration).toLowerCase()} (${notSuitable.length})`} hint="Time limit too short, or no price listed"><ul>{notSuitable.map(o => <OptionRow key={o.id} option={o} at={arrival} later={later} starred={favIds.has(o.id)} onClick={() => pick(o)} />)}</ul></Group>}
            {!later && updatedAt && fitting.some(o => o.live) && <p className="mt-3 px-2 text-xs text-[#64748b]">Free bays from City of Melbourne sensors · updated {clock(updatedAt)}</p>}
          </>}

          {!melbourne && <div className="px-2 py-3">
            <p className="text-sm text-[#40516d]">Bay covers Melbourne for now. Search for a place in Melbourne, or jump to the CBD.</p>
            <button onClick={() => setDestination(MELBOURNE_CBD)} className="mt-3 h-12 w-full rounded-[16px] bg-[#1769ff] text-sm font-bold text-white transition-transform active:scale-[0.98]">Show parking in Melbourne CBD</button>
          </div>}
        </div>
      </section>
    </div>

    {searchOpen && <SearchOverlay saved={favourites} onSaved={f => { setDestination({ lat: f.lat, lng: f.lng, label: f.name }); setSearchOpen(false) }} onClose={() => setSearchOpen(false)} onVenue={goToVenue}
      onPick={place => { trackEvent('parking_search', { result_source: 'geocoder' }); setDestination({ lat: place.lat, lng: place.lng, label: place.name }); setSearchOpen(false) }} />}
    <OptionSheet key={selected?.id ?? 'none'} option={selected} durationMinutes={duration} arrival={arrival} later={later} onClose={() => setSelectedId(null)} />
  </main>
}

function OptionTitle({ option, starred }: { option: ParkingOption; starred?: boolean }) {
  const title = option.kind === 'carpark' ? option.name : splitStreet(option.name).title
  return <span className="flex items-center gap-1 text-[15px] font-semibold text-[#0b1730]"><span className="truncate">{title}</span>{starred && <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" aria-label="Saved" />}</span>
}

/** One plain line: "2 min walk · 2 hr max · 3 free now" or "Car park · 5 min walk". */
/** "2 hrs max" when that's the sign's limit. When free hours come first (e.g.
 * arriving at midnight before a 7:30am 2P), say until when instead. */
function maxStayText(limitMinutes: number, at: Date) {
  return limitMinutes % 15 === 0 && limitMinutes <= 240 ? `${formatDurationShort(limitMinutes)} max` : `till ${clock(new Date(at.getTime() + limitMinutes * 60_000))}`
}

function Facts({ option, at, later }: { option: ParkingOption; at: Date; later: boolean }) {
  const parts = [option.kind === 'carpark' ? `${option.operator ?? 'Car'} car park` : null, `${walkMinutes(option.distanceM)} min walk`]
  if (option.limitMinutes != null) parts.push(maxStayText(option.limitMinutes, at))
  const live = option.live && !later ? option.live : null
  return <span className="mt-0.5 line-clamp-2 block text-[13px] leading-[18px] text-[#40516d] tabular-nums">
    {parts.filter(Boolean).join(' · ')}
    {live && <> · {live.free > 0 ? <span className="font-semibold text-[#047857]">{live.free} free now</span> : <span className="font-semibold text-[#b45309]">Full now</span>}</>}
  </span>
}

function BestCard({ option, duration, at, later, starred, onOpen }: { option: ParkingOption; duration: number; at: Date; later: boolean; starred?: boolean; onOpen: () => void }) {
  const leave = option.limitMinutes != null && option.limitMinutes < duration ? option.limitMinutes : duration
  return <div className="rounded-[22px] bg-[#f5f8ff] shadow-[inset_0_0_0_1px_rgba(23,105,255,.14)]">
    <button onClick={onOpen} className="flex w-full items-start gap-3 rounded-t-[22px] px-4 pb-2 pt-4 text-left" aria-label={`${option.name}, details`}>
      <span className="min-w-0 flex-1"><OptionTitle option={option} starred={starred} /><Facts option={option} at={at} later={later} /></span>
      <span key={priceText(option)} className="bay-price shrink-0 text-right text-[28px] font-extrabold leading-none tracking-tight text-[#0b1730] tabular-nums">{priceText(option)}</span>
    </button>
    <div className="flex items-center gap-3 px-4 pb-3 pt-1">
      <span className="min-w-0 flex-1 text-sm text-[#40516d]">Leave by <strong className="font-bold text-[#0b1730] tabular-nums">{clock(new Date(at.getTime() + leave * 60_000))}</strong></span>
      <a href={directionsUrl(option.lat, option.lng)} target="_blank" rel="noreferrer" onClick={() => trackEvent('directions_open', { result_type: option.kind })}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-[#1769ff] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(23,105,255,.3)] transition-transform active:scale-[0.97]"><Navigation2 className="h-4 w-4" />Go</a>
    </div>
  </div>
}

function OptionRow({ option, at, later, starred, onClick }: { option: ParkingOption; at: Date; later: boolean; starred?: boolean; onClick: () => void }) {
  const price = option.fits === false ? null : priceText(option)
  return <li>
    <button onClick={onClick} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-[#f5f8ff]">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${option.kind === 'carpark' ? 'bg-[#1769ff] text-white' : 'bg-[#eef4ff] text-[#1769ff]'}`} aria-hidden>{option.kind === 'carpark' ? <CarFront className="h-[18px] w-[18px]" /> : <MapPin className="h-[18px] w-[18px]" />}</span>
      <span className="min-w-0 flex-1"><OptionTitle option={option} starred={starred} /><Facts option={option} at={at} later={later} /></span>
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

function ParkingTimerBar({ name, lat, lng, leaveBy, minutesLeft, onEnd }: { name: string; lat: number; lng: number; leaveBy: string; minutesLeft: number; onEnd: () => void }) {
  const over = minutesLeft < 0
  const soon = !over && minutesLeft <= 15
  const tone = over ? 'bg-red-600 text-white' : soon ? 'bg-amber-400 text-[#2b1a00]' : 'bg-[#07152f] text-white'
  const left = over ? `${formatDurationShort(-minutesLeft)} over` : `${formatDurationShort(Math.max(minutesLeft, 0))} left`
  return <div role="timer" aria-live="polite" className={`bay-rise flex items-center gap-3 rounded-[20px] py-2 pl-3.5 pr-2 shadow-[0_10px_30px_rgba(15,23,42,.18)] transition-colors duration-500 ${tone}`}>
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${soon ? 'bay-pulse' : ''}`}><BellRing className="h-5 w-5" /></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold tabular-nums">{left}</span>
      <span className="block truncate text-xs opacity-80">Leave by {clock(new Date(leaveBy))} · {name}</span>
    </span>
    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`} target="_blank" rel="noreferrer" className="flex h-10 shrink-0 items-center rounded-[14px] bg-white/15 px-3 text-xs font-bold transition-transform active:scale-[0.97]">Find car</a>
    <button onClick={onEnd} className="h-10 shrink-0 rounded-[14px] bg-white/15 px-3 text-xs font-bold transition-transform active:scale-[0.97]">I've left</button>
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
  return <div className="bay-fade fixed inset-0 z-[1100] overflow-y-auto bg-white px-3 pb-8 pt-[max(.75rem,env(safe-area-inset-top))]">
    <div className="mx-auto max-w-xl">
      <form onSubmit={e => { e.preventDefault(); void run() }} className="flex items-center gap-2 rounded-[20px] bg-[#f5f8ff] pl-3.5 pr-1.5 shadow-[inset_0_0_0_1px_#dce7f8] focus-within:shadow-[inset_0_0_0_2px_#1769ff]">
        <Search className="h-5 w-5 shrink-0 text-[#1769ff]" />
        <input autoFocus enterKeyHint="search" value={query} onChange={e => { request.current++; setQuery(e.target.value); setSearched(false) }} placeholder="Where in Melbourne?" aria-label="Where are you going?" className="min-h-[52px] min-w-0 flex-1 bg-transparent text-base text-[#0b1730] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[#64748b]" />
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#64748b]" aria-label="Close"><X className="h-5 w-5" /></button>
      </form>
      {query.trim().length >= 3 && <button onClick={() => void run()} disabled={busy} className="mt-2 h-12 w-full rounded-[18px] bg-[#1769ff] text-sm font-bold text-white transition-transform active:scale-[0.99] disabled:opacity-60">{busy ? 'Searching…' : `Search “${query.trim()}”`}</button>}
      {results.length > 0 && <ul className="mt-3">{results.map((place, i) => <li key={`${place.name}-${i}`}><button onClick={() => onPick(place)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]"><MapPin className="h-5 w-5 shrink-0 text-[#1769ff]" /><span className="min-w-0"><span className="block text-[15px] font-semibold text-[#0b1730]">{place.name}</span>{place.address && <span className="block truncate text-xs text-[#64748b]">{place.address}</span>}</span></button></li>)}</ul>}
      {searched && !busy && results.length === 0 && <p className="mt-3 px-2 text-sm text-[#40516d]">No places found. Try a street name or landmark.</p>}
      {!query && <>
        {saved.length > 0 && <>
          <p className="mt-5 px-2 text-xs font-semibold text-[#64748b]">Your saved spots</p>
          <ul className="mt-1">{saved.slice(0, 6).map(f => <li key={f.id}><button onClick={() => onSaved(f)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-amber-50 text-amber-500"><Star className="h-5 w-5" fill="currentColor" /></span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#0b1730]">{f.name}</span>
            <ChevronRight className="h-5 w-5 text-[#64748b]" />
          </button></li>)}</ul>
        </>}
        <p className="mt-5 px-2 text-xs font-semibold text-[#64748b]">Going to an event?</p>
        <ul className="mt-1">{VENUES.map(v => <li key={v.id}><button onClick={() => onVenue(v)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-[#f5f8ff]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#eef4ff] text-[#1769ff]"><Ticket className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-[#0b1730]">{v.name}</span><span className="block text-xs text-[#64748b]">Shows parking for {durationLabel(v.minutes).toLowerCase()}</span></span>
          <ChevronRight className="h-5 w-5 text-[#64748b]" />
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
    <div role="menu" aria-label="When are you arriving?" className="bay-menu absolute right-0 top-12 z-[700] w-52 rounded-[20px] bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.08),0_16px_40px_rgba(15,23,42,.18)]">
      <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[#64748b]">Arriving</p>
      {choices.map(c => <button key={String(c.v)} role="menuitemradio" aria-checked={value === c.v} onClick={() => onPick(c.v)}
        className={`flex min-h-11 w-full items-center justify-between rounded-[14px] px-3 text-left text-sm font-semibold hover:bg-[#f5f8ff] ${value === c.v ? 'text-[#1769ff]' : 'text-[#0b1730]'}`}>
        {c.label}{value === c.v && <Check className="h-4 w-4" />}
      </button>)}
    </div>
  </>
}

function SavedMenu({ saved, onSave, onSelect, onClose }: { saved: SavedLocations; onSave: (kind: SavedPlaceKind) => void; onSelect: (kind: SavedPlaceKind) => void; onClose: () => void }) {
  const act = (fn: () => void) => { fn(); onClose() }
  const item = 'flex min-h-11 w-full items-center gap-2.5 rounded-[14px] px-3 text-left text-sm font-semibold text-[#0b1730] hover:bg-[#f5f8ff]'
  return <div className="bay-menu absolute right-0 top-12 z-[700] w-60 rounded-[20px] bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.08),0_16px_40px_rgba(15,23,42,.18)]">
    {saved.home && <button onClick={() => act(() => onSelect('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#1769ff]" />Home</button>}
    {saved.work && <button onClick={() => act(() => onSelect('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#1769ff]" />Work</button>}
    <button onClick={() => act(() => onSave('home'))} className={item}><HomeIcon className="h-4 w-4 text-[#64748b]" />Save this as home</button>
    <button onClick={() => act(() => onSave('work'))} className={item}><BriefcaseBusiness className="h-4 w-4 text-[#64748b]" />Save this as work</button>
  </div>
}
