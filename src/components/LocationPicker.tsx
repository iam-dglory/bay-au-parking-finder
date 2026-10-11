import { useEffect, useMemo, useRef, useState } from 'react'
import Country from 'country-state-city/lib/country'
import { ArrowUpRight, ChevronDown, Clock3, LocateFixed, Loader2, MapPin, Search, TriangleAlert, X } from 'lucide-react'
import { searchCities, type CitySearchResult } from '../lib/geocoding'
import { LocationError } from '../lib/geolocation'
import { BrandMark } from './BrandMark'
import type { SavedLocations, SavedPlaceKind } from '../lib/savedLocations'

const ALL_COUNTRIES = Country.getAllCountries()
const DEFAULT_COUNTRY = ''
const SEARCH_DEBOUNCE_MS = 400

type RecentPlace = { kind: SavedPlaceKind | 'last'; label: string; lat: number; lng: number; country?: string }

function recentPlaces(saved: SavedLocations): RecentPlace[] {
  const candidates: RecentPlace[] = [
    ...(saved.last ? [{ kind: 'last' as const, ...saved.last }] : []),
    ...(saved.home ? [{ kind: 'home' as const, ...saved.home }] : []),
    ...(saved.work ? [{ kind: 'work' as const, ...saved.work }] : []),
  ]
  const seen = new Set<string>()
  return candidates.filter(place => {
    const key = `${place.lat.toFixed(5)}:${place.lng.toFixed(5)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)
}

/** A compact first-use search surface. The search is deliberately a single
 * flow: choose the country in the field, then find a city/suburb or use GPS. */
export function LocationPicker({ onPick, onUseGps, savedLocations }: {
  onPick: (lat: number, lng: number, label: string, country?: string) => void
  onUseGps: () => Promise<void>
  savedLocations: SavedLocations
}) {
  const [countryCode, setCountryCode] = useState(() => {
    const region = typeof navigator !== 'undefined' ? new Intl.Locale(navigator.language).region : undefined
    return region && ALL_COUNTRIES.some(country => country.isoCode === region) ? region : DEFAULT_COUNTRY
  })
  const [citySearch, setCitySearch] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recents = useMemo(() => recentPlaces(savedLocations), [savedLocations])
  const countryName = countryCode ? Country.getCountryByCode(countryCode)?.name : undefined

  useEffect(() => {
    let active = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!citySearch.trim()) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchCities(citySearch, countryCode)
        if (active) setResults(found)
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      active = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [citySearch, countryCode])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleCountryChange(code: string) {
    setCountryCode(code)
    setCitySearch('')
    setResults([])
    setShowSuggestions(false)
  }

  function selectCity(city: CitySearchResult) {
    setCitySearch(city.name)
    setShowSuggestions(false)
    onPick(city.lat, city.lng, city.stateName ? `${city.name}, ${city.stateName}` : city.name, countryName)
  }

  async function searchOnline() {
    if (!citySearch.trim() || !countryCode) return
    setSearching(true)
    try {
      setResults(await searchCities(citySearch, countryCode, undefined, true))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
      setShowSuggestions(true)
    }
  }

  async function handleUseGps() {
    setLocating(true)
    setGpsError(null)
    try {
      await onUseGps()
    } catch (error) {
      const reason = error instanceof LocationError ? error.reason : undefined
      setGpsError(reason === 'permission_denied'
        ? 'Location access is off. Enable it for Bay, or search for a city instead.'
        : reason === 'timeout'
          ? 'Location took too long. Try again or search for a city instead.'
          : "Bay couldn't get your location. Search for a city instead.")
    } finally {
      setLocating(false)
    }
  }

  return <main className="min-h-full overflow-y-auto bg-[#f7faff] text-[#0b1730]">
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <BrandMark className="w-[84px]" />
        <span className="rounded-full border border-[#e3eaf3] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#64748b] shadow-sm">Parking, clearer</span>
      </header>

      <section className="pt-10 sm:pt-12">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#1769ff]">Bay parking</p>
        <h1 className="mt-2 text-[clamp(2.25rem,11vw,3.3rem)] font-bold leading-[.96] tracking-[-.065em] text-[#07152f]">Find parking.<br /><span className="text-[#1769ff]">Faster.</span></h1>
        <p className="mt-3 text-base font-medium text-[#64748b]">Know more before you arrive.</p>
      </section>

      <section className="mt-8" aria-label="Choose a parking location">
        <label htmlFor="parking-location" className="mb-2 block text-sm font-bold text-[#0b1730]">Where do you want to park?</label>
        <div ref={boxRef} className="relative rounded-[24px] border border-[#dce7f8] bg-white p-2 shadow-[0_16px_36px_rgba(37,99,235,.10)] transition focus-within:border-[#1769ff] focus-within:shadow-[0_18px_40px_rgba(37,99,235,.16)]">
          <div className="relative flex items-center rounded-[18px] bg-[#f5f8fd] px-3">
            {searching ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#1769ff]" /> : <Search className="h-5 w-5 shrink-0 text-[#1769ff]" />}
            <input
              id="parking-location"
              value={citySearch}
              onChange={event => { setCitySearch(event.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void searchOnline() } }}
              placeholder={countryCode ? 'City or suburb' : 'Choose a country first'}
              disabled={!countryCode}
              className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base font-medium text-[#0b1730] outline-none placeholder:text-[#94a3b8] disabled:cursor-not-allowed"
            />
            {citySearch && <button onClick={() => { setCitySearch(''); setResults([]) }} className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-white hover:text-[#40516d]" aria-label="Clear location search"><X className="h-4 w-4" /></button>}
            <button type="button" disabled={!countryCode || searching || citySearch.trim().length < 2} onClick={() => void searchOnline()} className="ml-1 rounded-xl bg-[#07152f] p-2.5 text-white shadow-sm transition hover:bg-[#1769ff] disabled:opacity-35" aria-label="Search location"><ArrowUpRight className="h-4 w-4" /></button>
          </div>
          <div className="relative mt-2 flex items-center rounded-xl px-2.5 py-1.5 hover:bg-[#f5f8fd]">
            <MapPin className="h-4 w-4 text-[#64748b]" />
            <select value={countryCode} onChange={event => handleCountryChange(event.target.value)} aria-label="Search country" className="min-w-0 flex-1 appearance-none bg-transparent px-2 py-1 text-xs font-semibold text-[#40516d] outline-none">
              <option value="" disabled>Choose country</option>
              {ALL_COUNTRIES.map(country => <option key={country.isoCode} value={country.isoCode}>{country.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none h-4 w-4 text-[#94a3b8]" />
          </div>
          {showSuggestions && citySearch.trim() && <div role="listbox" className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-60 overflow-y-auto rounded-2xl border border-[#dce7f8] bg-white p-1.5 shadow-2xl">
            {!searching && results.length === 0 && <p className="px-3 py-3 text-sm text-[#64748b]">No match yet. Try a fuller name or search online.</p>}
            {results.map((city, index) => <button key={`${city.name}-${city.lat}-${city.lng}-${index}`} role="option" onClick={() => selectCity(city)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#eef5ff]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1769ff]"><MapPin className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-bold text-[#0b1730]">{city.name}</span>{city.stateName && <span className="block truncate text-xs text-[#64748b]">{city.stateName}</span>}</span></button>)}
          </div>}
        </div>

        <button onClick={handleUseGps} disabled={locating} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-1.5 py-2 text-sm font-bold text-[#1769ff] transition hover:text-[#07152f] disabled:opacity-60">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        {gpsError && <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{gpsError}</p>}
      </section>

      {recents.length > 0 && <section className="mt-8" aria-label="Recent locations">
        <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-[#94a3b8]" /><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#64748b]">Recent</p></div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {recents.map(place => <button key={`${place.kind}-${place.lat}-${place.lng}`} onClick={() => onPick(place.lat, place.lng, place.label, place.country)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dce7f8] bg-white px-3 py-2 text-xs font-semibold text-[#40516d] shadow-sm transition hover:border-[#1769ff] hover:text-[#1769ff]"><MapPin className="h-3.5 w-3.5" />{place.label}</button>)}
        </div>
      </section>}
    </div>
  </main>
}
