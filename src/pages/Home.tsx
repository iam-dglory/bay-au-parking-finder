import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Pencil, Search, Loader2, X, LocateFixed } from 'lucide-react'
import { MapView } from '../components/MapView'
import { zoomForRadius } from '../lib/mapZoom'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { FilterBar } from '../components/FilterBar'
import { useNearbyParking } from '../lib/useNearbyParking'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'
import { rankSpots } from '../lib/parkingStatus'
import { searchPlaces, type PlaceSearchResult } from '../lib/geocoding'
import { useClock } from '../lib/useClock'
import { LOGO_URL } from '../lib/assets'
import type { ParkingSpot, SpotStatus, SignType } from '../types'

const DESTINATION_SEARCH_DEBOUNCE_MS = 400

export function Home({
  center,
  myLocation,
  locationLabel,
  testerNumber,
  onChangeLocation,
}: {
  center: { lat: number; lng: number }
  /** Live GPS position, updated continuously while driving. Distinct from
   * `center` (where the current search is anchored) -- see MapView. */
  myLocation?: { lat: number; lng: number }
  locationLabel: string
  testerNumber: number | null
  onChangeLocation: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [radiusM, setRadiusM] = useState(1000)
  const [freeOnly, setFreeOnly] = useState(false)
  const [category, setCategory] = useState<SignType | 'all'>('all')
  const [showCarParks, setShowCarParks] = useState(false)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selectedSpot, setSelectedSpot] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [showDestSearch, setShowDestSearch] = useState(false)
  const [destQuery, setDestQuery] = useState('')
  const [destResults, setDestResults] = useState<PlaceSearchResult[]>([])
  const [destSearching, setDestSearching] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const destBoxRef = useRef<HTMLDivElement>(null)
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveCenter = destination ?? center

  const now = useClock()
  const { spots, loading, error, updatedAt, refresh } = useNearbyParking(expanded ? effectiveCenter : null, radiusM)
  const { carParks } = useNearbyCarParks(expanded ? effectiveCenter : null, radiusM, showCarParks)

  const ranked = useMemo(() => {
    let all = rankSpots(spots, now)
    if (freeOnly) all = all.filter((s) => s.status.status === 'free')
    if (category !== 'all') all = all.filter((s) => s.rules.some((r) => r.sign_type === category))
    return all
  }, [spots, freeOnly, category, now])

  const selected = selectedSpot ? ranked.find((s) => s.id === selectedSpot.id) ?? selectedSpot : null

  useEffect(() => {
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current)
    if (!destQuery.trim()) {
      setDestResults([])
      return
    }
    setDestSearching(true)
    destDebounceRef.current = setTimeout(async () => {
      const found = await searchPlaces(destQuery, center)
      setDestResults(found)
      setDestSearching(false)
    }, DESTINATION_SEARCH_DEBOUNCE_MS)
    return () => {
      if (destDebounceRef.current) clearTimeout(destDebounceRef.current)
    }
  }, [destQuery, center])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (destBoxRef.current && !destBoxRef.current.contains(e.target as Node)) setShowDestSuggestions(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectDestination(p: PlaceSearchResult) {
    setDestination({ lat: p.lat, lng: p.lng, label: p.name })
    setDestQuery('')
    setDestResults([])
    setShowDestSuggestions(false)
    setShowDestSearch(false)
  }

  function clearDestination() {
    setDestination(null)
    setDestQuery('')
    setDestResults([])
  }

  if (!expanded) {
    return (
      <div className="flex h-full flex-col bg-[#f6f8fc] text-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-5 py-4">
          <img src={LOGO_URL} alt="Bay" className="h-9 w-9 rounded-xl shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-slate-900">Bay</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10 text-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Parking intelligence, in one place</div>
            <p className="text-2xl font-semibold tracking-tight text-slate-950">Hi, Test User{testerNumber ? ` ${testerNumber}` : ''}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">Your testing and feedback help make parking information more trustworthy.</p>
          </div>

          <div className="h-52 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/80">
            <MapView center={center} myLocation={myLocation} spots={[]} glowMe />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600">You're near</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{locationLabel}</p>
          </div>

          <button
            onClick={() => setExpanded(true)}
            className="flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <LocateFixed className="h-4 w-4" strokeWidth={2} />
            Find parking near me
          </button>
          <button onClick={onChangeLocation} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-700">
            <Pencil className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
            Change location
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(false)} aria-label="Back to home">
              <img src={LOGO_URL} alt="Bay" className="h-8 w-8 rounded-xl" />
            </button>
            <span className="text-lg font-bold tracking-tight text-slate-900">Bay</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDestSearch((v) => !v)}
              aria-label="Search parking near a destination"
              className={`rounded-full p-1.5 ${showDestSearch ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Search className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-sm font-semibold">
              <button onClick={() => setView('map')} className={`px-3 py-1.5 ${view === 'map' ? 'rounded-lg bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}>
                Map
              </button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 ${view === 'list' ? 'rounded-lg bg-slate-900 text-white shadow-sm' : 'text-slate-600'}`}>
                List
              </button>
            </div>
          </div>
        </div>

        {showDestSearch && (
          <div ref={destBoxRef} className="relative mt-3">
            <p className="mb-1.5 text-xs text-slate-500">Check parking near a shopping centre, restaurant, or address before you head out.</p>
            <div className="relative">
              {destSearching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
              ) : (
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}
              <input
                autoFocus
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value)
                  setShowDestSuggestions(true)
                }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="e.g. Westfield Bondi Junction"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
            {showDestSuggestions && destQuery.trim() && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {!destSearching && destResults.length === 0 && <p className="px-3 py-2.5 text-sm text-slate-400">No matches. Try a different search.</p>}
                {destResults.map((p, i) => (
                  <button key={i} onClick={() => selectDestination(p)} className="block w-full px-3 py-2.5 text-left hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-800">{p.name}</p>
                    {p.address && <p className="text-xs text-slate-400">{p.address}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {destination ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" strokeWidth={2} />
              <span className="truncate">Near {destination.label}</span>
            </span>
            <button onClick={clearDestination} className="flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" strokeWidth={2} /> Back to {locationLabel}
            </button>
          </div>
        ) : (
          <button onClick={onChangeLocation} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900" aria-label="Change location">
            <MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
            {locationLabel}
            <Pencil className="h-3 w-3 text-slate-400" strokeWidth={2} />
          </button>
        )}
        <p className="text-xs text-slate-500">{ranked.length} spots found</p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{loading ? 'Loading all nearby bays…' : updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
          <button onClick={refresh} disabled={loading} className="underline">Refresh</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"><span className="font-semibold text-slate-800">Reading the map</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Vacant</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Occupied</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Uncertain</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Unknown</span><span className="text-slate-400">Vacancy does not mean parking is permitted.</span></div>
      </div>

      <FilterBar
        radiusM={radiusM}
        onRadiusChange={setRadiusM}
        freeOnly={freeOnly}
        onFreeOnlyChange={setFreeOnly}
        category={category}
        onCategoryChange={setCategory}
        showCarParks={showCarParks}
        onShowCarParksChange={setShowCarParks}
      />

      {error && (
        <div className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <span className="font-semibold">Parking data unavailable.</span> {error}{' '}
          <button onClick={refresh} className="underline">
            retry
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-[0_-8px_30px_rgba(30,64,175,0.06)]">
        {view === 'map' ? (
          <MapView
            center={effectiveCenter}
            myLocation={myLocation}
            spots={ranked}
            carParks={carParks}
            onSelectSpot={setSelectedSpot}
            zoom={zoomForRadius(radiusM)}
            glowMe
            radiusM={radiusM}
          />
        ) : (
          <div className="h-full space-y-2 overflow-y-auto p-4">
            {loading && <p className="text-center text-sm text-slate-400">Loading…</p>}
            {!loading && ranked.length === 0 && <p className="text-center text-sm text-slate-400">No parking spots recorded near here yet.</p>}
            {ranked.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onClick={() => setSelectedSpot(spot)} />
            ))}
          </div>
        )}
      </div>

      <SpotDetailSheet spot={selected} onClose={() => setSelectedSpot(null)} onUpdated={refresh} />
    </div>
  )
}
