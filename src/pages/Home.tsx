import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, BriefcaseBusiness, ChevronRight, CircleHelp, HomeIcon, MapPin, ParkingSquare, Search, SlidersHorizontal, X } from 'lucide-react'
import { zoomForRadius } from '../lib/mapZoom'
import { SpotCard } from '../components/SpotCard'
import { ParkingAreaDetails } from '../components/ParkingAreaDetails'
import { ParkingAreaSheet } from '../components/ParkingAreaSheet'
import { isIndiaSearch } from '../lib/indiaParking'
import { isUSSearch } from '../lib/usaParking'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { FilterBar } from '../components/FilterBar'
import { BrandMark } from '../components/BrandMark'
import { useNearbyParking } from '../lib/useNearbyParking'
import { useNearbyCarParks } from '../lib/useNearbyCarParks'
import { rankSpots, evaluateSpotStatus } from '../lib/parkingStatus'
import { searchPlaces, type PlaceSearchResult } from '../lib/geocoding'
import { useClock } from '../lib/useClock'
import { availability } from '../lib/availability'
import type { CarPark, ParkingSpot, SpotStatus, SignType } from '../types'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'

const MapView = lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })))
const RADII = [{ label: '500 m', value: 500 }, { label: '1 km', value: 1000 }, { label: '2 km', value: 2000 }, { label: '5 km', value: 5000 }]

export function Home({ center, myLocation, locationLabel, onChangeLocation, savedLocations, onSavePlace, onSelectSavedPlace }: {
  center: { lat: number; lng: number }; myLocation?: { lat: number; lng: number }; locationLabel: string; onChangeLocation: () => void
  savedLocations: SavedLocations; onSavePlace: (kind: SavedPlaceKind) => void; onSelectSavedPlace: (kind: SavedPlaceKind) => void
}) {
  const [radiusM, setRadiusM] = useState(1000)
  const [vacantOnly, setVacantOnly] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [category, setCategory] = useState<SignType | 'all'>('all')
  const [showCarParks, setShowCarParks] = useState(true)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)
  const [selectedArea, setSelectedArea] = useState<CarPark | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [showDestSearch, setShowDestSearch] = useState(false)
  const [destQuery, setDestQuery] = useState('')
  const [destResults, setDestResults] = useState<PlaceSearchResult[]>([])
  const [destSearching, setDestSearching] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const destBoxRef = useRef<HTMLDivElement>(null)
  const destRequest = useRef(0)
  const effectiveCenter = destination ?? center
  const now = useClock()
  const { spots, loading, updatedAt, refresh } = useNearbyParking(effectiveCenter, radiusM)
  const { carParks, loading: areasLoading, refresh: refreshAreas } = useNearbyCarParks(effectiveCenter, radiusM, showCarParks && !vacantOnly)
  const usa = isUSSearch(effectiveCenter.lat, effectiveCenter.lng)
  const india = isIndiaSearch(effectiveCenter.lat, effectiveCenter.lng)

  useEffect(() => { if (usa) { setVacantOnly(false); setFreeOnly(false); setCategory('all') } }, [usa])
  useEffect(() => { setSelectedSpot(null); setSelectedArea(null) }, [effectiveCenter.lat, effectiveCenter.lng, radiusM])
  useEffect(() => { const close = (e: MouseEvent) => { if (destBoxRef.current && !destBoxRef.current.contains(e.target as Node)) setShowDestSuggestions(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])

  const ranked = useMemo(() => {
    let list = rankSpots(spots, now)
    if (vacantOnly) list = list.filter(s => availability(s, now).state === 'vacant')
    if (freeOnly) list = list.filter(s => s.status.status === 'free')
    if (category !== 'all') list = list.filter(s => s.rules.some(r => r.sign_type === category))
    return list
  }, [spots, now, vacantOnly, freeOnly, category])
  const selectedRow = selectedSpot ? spots.find(s => s.id === selectedSpot.id) : null
  const selected = selectedRow ? { ...selectedRow, status: evaluateSpotStatus(selectedRow.rules, selectedRow.lat, selectedRow.lng, now) } : null
  const total = ranked.length + carParks.length
  const availabilitySummary = useMemo(() => ranked.reduce((summary, spot) => { summary[availability(spot, now).state] += 1; return summary }, { vacant: 0, occupied: 0, uncertain: 0, unknown: 0 }), [ranked, now])

  async function searchDestination() {
    if (destQuery.trim().length < 3) return
    const request = ++destRequest.current; setDestSearching(true)
    const found = await searchPlaces(destQuery, center)
    if (request === destRequest.current) { setDestResults(found); setDestSearching(false); setShowDestSuggestions(true) }
  }
  function selectDestination(place: PlaceSearchResult) { setDestination({ lat: place.lat, lng: place.lng, label: place.name }); setDestQuery(''); setDestResults([]); setShowDestSuggestions(false); setShowDestSearch(false) }
  function clearDestination() { setDestination(null); setDestQuery(''); setDestResults([]) }
  const resetRefresh = () => { refresh(); refreshAreas() }
  const filterCount = Number(vacantOnly) + Number(freeOnly) + Number(category !== 'all') + Number(!showCarParks)

  return <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f9fc]">
    <div className="relative min-h-0 flex-1">
      {view === 'map' ? <Suspense fallback={<MapLoading />}><MapView center={effectiveCenter} myLocation={myLocation} spots={ranked} carParks={carParks} onSelectSpot={setSelectedSpot} onSelectCarPark={setSelectedArea} zoom={zoomForRadius(radiusM)} glowMe radiusM={radiusM} /></Suspense> : <ParkingList loading={loading || areasLoading} ranked={ranked} areas={carParks} usa={usa} vacantOnly={vacantOnly} filtered={freeOnly || category !== 'all'} onSpot={setSelectedSpot} onArea={setSelectedArea} />}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_12px_30px_rgba(15,23,42,.14)] backdrop-blur">
            <button onClick={onChangeLocation} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50" aria-label="Change search location"><BrandMark className="w-[54px] shrink-0" /><span className="min-w-0 border-l border-[#e3eaf3] pl-2"><span className="flex items-center gap-1 text-xs font-bold text-[#0b1730]"><MapPin className="h-3.5 w-3.5 text-[#1769ff]" /><span className="truncate">{destination ? `Near ${destination.label}` : locationLabel}</span></span><span className="block truncate text-[11px] text-[#64748b]">Tap to change location</span></span></button>
            <button onClick={() => setShowDestSearch(v => !v)} className={`bay-icon-button h-10 w-10 shrink-0 ${showDestSearch ? '!bg-[#07152f] !text-white' : ''}`} aria-label="Search another destination"><Search className="h-4.5 w-4.5" /></button>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold"><button onClick={() => setView('map')} className={`rounded-lg px-3 py-2 ${view === 'map' ? 'bg-[#07152f] text-white shadow-sm' : 'text-[#64748b]'}`}>Map</button><button onClick={() => setView('list')} className={`rounded-lg px-3 py-2 ${view === 'list' ? 'bg-[#07152f] text-white shadow-sm' : 'text-[#64748b]'}`}>List</button></div>
          </div>
          {showDestSearch && <div ref={destBoxRef} className="relative mt-2 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur"><div className="flex items-center gap-2"><Search className="ml-2 h-4 w-4 shrink-0 text-[#64748b]" /><input autoFocus value={destQuery} onChange={e => { destRequest.current++; setDestQuery(e.target.value); setDestResults([]); setShowDestSuggestions(true) }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchDestination() } }} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" placeholder="Search a destination" /><button onClick={() => void searchDestination()} disabled={destSearching || destQuery.trim().length < 3} className="rounded-xl bg-[#1769ff] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{destSearching ? 'Searching' : 'Search'}</button><button onClick={() => setShowDestSearch(false)} className="p-2 text-slate-400"><X className="h-4 w-4" /></button></div>{showDestSuggestions && destQuery.trim() && <div className="mt-1 max-h-48 overflow-y-auto border-t border-[#e3eaf3] pt-1">{!destSearching && destResults.length === 0 && <p className="px-3 py-3 text-sm text-[#64748b]">Press Search to find a destination.</p>}{destResults.map((place, index) => <button key={`${place.name}-${index}`} onClick={() => selectDestination(place)} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-blue-50"><span className="block text-sm font-semibold text-[#0b1730]">{place.name}</span>{place.address && <span className="block truncate text-xs text-[#64748b]">{place.address}</span>}</button>)}</div>}</div>}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{RADII.map(option => <button key={option.value} onClick={() => setRadiusM(option.value)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm ${radiusM === option.value ? 'border-[#1769ff] bg-[#1769ff] text-white' : 'border-white/80 bg-white/95 text-[#40516d]'}`}>{option.label}</button>)}<button onClick={() => setFiltersOpen(true)} className={`flex shrink-0 items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold text-[#40516d] shadow-sm ${filterCount ? 'text-[#1769ff]' : ''}`}><SlidersHorizontal className="h-3.5 w-3.5" />Filters{filterCount ? ` · ${filterCount}` : ''}</button><button onClick={() => setShowCarParks(v => !v)} className={`flex shrink-0 items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-bold shadow-sm ${showCarParks ? 'text-[#1769ff]' : 'text-[#64748b]'}`}><ParkingSquare className="h-3.5 w-3.5" />Areas</button></div>
        </div>
      </header>

      {view === 'map' && <div className="absolute inset-x-3 bottom-3 z-[450] mx-auto flex max-w-lg items-end justify-between gap-2 sm:bottom-4"><div className="rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"><p className="text-xs font-bold text-[#0b1730]">{loading || areasLoading ? 'Updating map…' : `${total.toLocaleString()} nearby places`}</p><p className="mt-0.5 text-[11px] text-[#64748b]">{usa || india || availabilitySummary.vacant + availabilitySummary.occupied === 0 ? 'Availability on arrival' : `${availabilitySummary.vacant} fresh vacant · ${availabilitySummary.occupied} occupied`}</p></div><div className="relative"><button onClick={() => setSavedOpen(v => !v)} className="bay-icon-button" aria-label="Saved locations"><Bookmark className="h-4.5 w-4.5" /></button>{savedOpen && <SavedMenu saved={savedLocations} onSave={onSavePlace} onSelect={onSelectSavedPlace} onClose={() => setSavedOpen(false)} />}</div><button onClick={() => setInfoOpen(v => !v)} className="bay-icon-button" aria-label="About map data"><CircleHelp className="h-4.5 w-4.5" /></button>{infoOpen && <div className="absolute bottom-14 right-0 w-[min(330px,calc(100vw-24px))] rounded-2xl border border-[#e3eaf3] bg-white p-3 text-xs leading-5 text-[#64748b] shadow-xl"><button onClick={resetRefresh} className="float-right ml-2 font-bold text-[#1769ff]">Refresh</button><p className="font-bold text-[#0b1730]">Map data</p><p className="mt-1">{usa ? 'Mapped street parking and parking areas. Check street signs and meters on arrival.' : india ? 'Mapped parking areas and source-listed terms. Live vacancy appears only where a current provider publishes it.' : 'Availability is only shown where a connected source provides a fresh reading. Physical signs control parking.'}</p>{updatedAt && <p className="mt-1 text-[11px]">Last map update {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}</div>}</div>}
    </div>
    {destination && <button onClick={clearDestination} className="absolute bottom-2 left-1/2 z-[600] -translate-x-1/2 rounded-full bg-[#07152f] px-4 py-2 text-xs font-bold text-white shadow-lg">Back to {locationLabel}</button>}
    {filtersOpen && <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/30 sm:items-center sm:p-5" onClick={() => setFiltersOpen(false)}><div className="w-full max-w-lg" onClick={e => e.stopPropagation()}><FilterBar vacantOnly={vacantOnly} onVacantOnlyChange={setVacantOnly} radiusM={radiusM} onRadiusChange={setRadiusM} freeOnly={freeOnly} onFreeOnlyChange={setFreeOnly} category={category} onCategoryChange={setCategory} showCarParks={showCarParks} onShowCarParksChange={setShowCarParks} mappedOnly={usa} onClose={() => setFiltersOpen(false)} /></div></div>}
    <SpotDetailSheet spot={selected} onClose={() => setSelectedSpot(null)} onUpdated={refresh} />
    <ParkingAreaSheet area={selectedArea} onClose={() => setSelectedArea(null)} />
  </main>
}

function MapLoading() { return <div className="flex h-full items-center justify-center bg-[#eef4ff] text-sm font-semibold text-[#64748b]">Loading map…</div> }
function ParkingList({ loading, ranked, areas, usa, vacantOnly, filtered, onSpot, onArea }: { loading: boolean; ranked: (ParkingSpot & { status: SpotStatus })[]; areas: CarPark[]; usa: boolean; vacantOnly: boolean; filtered: boolean; onSpot: (spot: ParkingSpot & { status: SpotStatus }) => void; onArea: (area: CarPark) => void }) {
 const empty = vacantOnly ? 'No fresh vacant bays in this search. Turn off the vacancy filter to see mapped parking.' : filtered ? 'No places match these filters. Try a wider radius or reset filters.' : 'No mapped parking is available for this search yet. Try a wider radius.'
 return <div className="h-full overflow-y-auto bg-[#f7f9fc] px-3 pb-6 pt-28 sm:px-5"><div className="mx-auto max-w-3xl">{loading && <p className="py-8 text-center text-sm text-[#64748b]">Updating nearby parking…</p>}{!loading && ranked.length === 0 && areas.length === 0 && <p className="rounded-2xl bg-white p-5 text-center text-sm text-[#64748b]">{empty}</p>}{!usa && <AreaList areas={areas} onArea={onArea} />}{ranked.length > 0 && <section className="mt-4"><p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#64748b]">{usa ? 'Mapped street parking' : 'Parking spots'} · {ranked.length}</p><div className="space-y-2">{ranked.map(spot => <SpotCard key={spot.id} spot={spot} onClick={() => onSpot(spot)} />)}</div></section>}{usa && <AreaList areas={areas} onArea={onArea} />}</div></div>
}
function AreaList({ areas, onArea }: { areas: CarPark[]; onArea: (area: CarPark) => void }) { if (!areas.length) return null; return <section><p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#64748b]">Parking areas · {areas.length}</p><div className="space-y-2">{areas.map(area => <article key={area.id} className="bay-card rounded-2xl p-4"><div className="flex justify-end"><button onClick={() => onArea(area)} className="-mt-1 -mr-1 flex items-center gap-1 text-xs font-bold text-[#1769ff]">View <ChevronRight className="h-3.5 w-3.5" /></button></div><ParkingAreaDetails area={area} compact /></article>)}</div></section> }
function SavedMenu({ saved, onSave, onSelect, onClose }: { saved: SavedLocations; onSave: (kind: SavedPlaceKind) => void; onSelect: (kind: SavedPlaceKind) => void; onClose: () => void }) { const act = (fn: () => void) => { fn(); onClose() }; return <div className="absolute bottom-12 right-0 z-[700] w-56 rounded-2xl border border-[#e3eaf3] bg-white p-1.5 shadow-xl"><button onClick={() => act(() => onSave('home'))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-slate-50"><HomeIcon className="h-4 w-4 text-[#1769ff]" />Save current as home</button><button onClick={() => act(() => onSave('work'))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-slate-50"><BriefcaseBusiness className="h-4 w-4 text-[#1769ff]" />Save current as work</button>{saved.home && <button onClick={() => act(() => onSelect('home'))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-blue-50"><HomeIcon className="h-4 w-4 text-slate-500" />Go to home</button>}{saved.work && <button onClick={() => act(() => onSelect('work'))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-blue-50"><BriefcaseBusiness className="h-4 w-4 text-slate-500" />Go to work</button>}</div> }
