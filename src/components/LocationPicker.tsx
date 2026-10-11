import { useEffect, useRef, useState } from 'react'
import Country from 'country-state-city/lib/country'
import { LocateFixed, ChevronDown, Search, Loader2, TriangleAlert, MapPinned, ShieldCheck } from 'lucide-react'
import { searchCities, type CitySearchResult } from '../lib/geocoding'
import { LocationError } from '../lib/geolocation'
import { WORDMARK_URL } from '../lib/assets'

const ALL_COUNTRIES = Country.getAllCountries()
const DEFAULT_COUNTRY = ''
const SEARCH_DEBOUNCE_MS = 400

export function LocationPicker({ onPick, onUseGps }: { onPick: (lat: number, lng: number, label: string, country?: string) => void; onUseGps: () => Promise<void> }) {
  const [countryCode, setCountryCode] = useState(() => {
    const region = typeof navigator !== 'undefined' ? new Intl.Locale(navigator.language).region : undefined
    return region && ALL_COUNTRIES.some((country) => country.isoCode === region) ? region : DEFAULT_COUNTRY
  })
  const [citySearch, setCitySearch] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleCountryChange(code: string) {
    setCountryCode(code)
    setCitySearch('')
    setResults([])
  }

  function selectCity(city: CitySearchResult) {
    setCitySearch(city.name)
    setShowSuggestions(false)
    onPick(city.lat, city.lng, city.stateName ? `${city.name}, ${city.stateName}` : city.name, Country.getCountryByCode(countryCode)?.name)
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
    } catch (err) {
      const reason = err instanceof LocationError ? err.reason : undefined
      if (reason === 'permission_denied') {
        setGpsError("Location access is off for Bay. Enable it in Settings → Apps → Bay → Permissions, or search for a city below.")
      } else if (reason === 'timeout') {
        setGpsError('Location took too long. Try again, or search for a city below.')
      } else {
        setGpsError("Bay couldn't get your location. Check permission or search for a city below.")
      }
    } finally {
      setLocating(false)
    }
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-[#f5f7fb] text-slate-900">
      <section className="relative shrink-0 overflow-hidden bg-[#07152f] px-5 pb-7 pt-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[15%] h-16 w-72 -rotate-6 rounded-[50%] border-[10px] border-blue-400/20" />
        <div className="relative mx-auto max-w-sm">
          <div className="flex items-center justify-between"><img src={WORDMARK_URL} alt="Bay" className="h-auto w-28 rounded-xl bg-white px-3 py-2" /><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-cyan-100">Parking, clearer</span></div>
          <p className="mt-6 max-w-sm text-2xl font-bold leading-tight tracking-[-.04em]">Find the nearest place to park.</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">See mapped areas, restrictions and source-listed prices before you arrive.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-200"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5"><MapPinned className="h-3.5 w-3.5 text-cyan-300" /> Nearby first</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Verify on arrival</span></div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Start a search</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Where are you parking?</h1>
          <p className="mt-1 text-sm leading-5 text-slate-500">Use your location or choose a city. Bay remembers your last choice for next time.</p>
        </div>

        <button
          onClick={handleUseGps}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" strokeWidth={2} />}
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        {gpsError && (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-rose-50 px-3 py-2.5 text-left text-xs leading-5 text-rose-700">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {gpsError}
          </p>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">or choose a place</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Country</label>
          <div className="relative mt-2">
            <select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-3.5 pr-10 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="" disabled>Choose country</option>
              {ALL_COUNTRIES.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>

          <div ref={boxRef} className="relative mt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">City or suburb</label>
            <div className="relative mt-2">
              {searching ? <Loader2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" /> : <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
              <input
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void searchOnline() } }}
                placeholder={countryCode ? 'Search for a city or suburb' : 'Choose country first'}
                disabled={!countryCode}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-24 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
              <button type="button" disabled={!countryCode || searching} onClick={() => void searchOnline()} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40">Search</button>
            </div>
            {showSuggestions && citySearch.trim() && (
              <div className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {!searching && results.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">No city found yet. Try a fuller name or press Search.</p>}
                {results.map((c, i) => <button key={`${c.name}-${c.lat}-${c.lng}-${i}`} onClick={() => selectCity(c)} className="block w-full rounded-xl px-3 py-3 text-left text-sm text-slate-700 hover:bg-blue-50"><span className="font-semibold">{c.name}</span>{c.stateName && <span className="text-slate-400"> · {c.stateName}</span>}</button>)}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
