import { useEffect, useMemo, useRef, useState } from 'react'
import Country from 'country-state-city/lib/country'
import State from 'country-state-city/lib/state'
import { LocateFixed, ChevronDown, Search, Loader2, TriangleAlert } from 'lucide-react'
import { searchCities, type CitySearchResult } from '../lib/geocoding'
import { LocationError } from '../lib/geolocation'
import { LOGO_URL } from '../lib/assets'

const ALL_COUNTRIES = Country.getAllCountries()
const DEFAULT_COUNTRY = 'AU'
const DEFAULT_STATE = 'NSW'
const SEARCH_DEBOUNCE_MS = 400

export function LocationPicker({ onPick, onUseGps }: { onPick: (lat: number, lng: number, label: string) => void; onUseGps: () => Promise<void> }) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY)
  const [stateCode, setStateCode] = useState(DEFAULT_STATE)
  const [citySearch, setCitySearch] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const states = useMemo(() => State.getStatesOfCountry(countryCode), [countryCode])
  const selectedStateName = useMemo(() => states.find((s) => s.isoCode === stateCode)?.name, [states, stateCode])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!citySearch.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const found = await searchCities(citySearch, countryCode, selectedStateName)
      setResults(found)
      setSearching(false)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [citySearch, countryCode, selectedStateName])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleCountryChange(code: string) {
    setCountryCode(code)
    const nextStates = State.getStatesOfCountry(code)
    setStateCode(nextStates[0]?.isoCode ?? '')
    setCitySearch('')
    setResults([])
  }

  function selectCity(city: CitySearchResult) {
    setCitySearch(city.name)
    setShowSuggestions(false)
    onPick(city.lat, city.lng, city.stateName ? `${city.name}, ${city.stateName}` : city.name)
  }

  async function handleUseGps() {
    setLocating(true)
    setGpsError(null)
    try {
      await onUseGps()
    } catch (err) {
      const reason = err instanceof LocationError ? err.reason : undefined
      if (reason === 'permission_denied') {
        setGpsError(
          "Location access is turned off for Bay. Open your phone's Settings → Apps → Bay → Permissions → Location, allow it, then try again, or search for your city below.",
        )
      } else if (reason === 'timeout') {
        setGpsError("Location took too long to respond. You may be indoors or have a weak GPS signal. Try again, or search for your city below.")
      } else {
        setGpsError("Couldn't get your location. Check that location access is allowed for this app, or search for your city below.")
      }
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white text-center">
      <div className="flex shrink-0 flex-col items-center gap-2 bg-slate-900 px-6 py-9">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Bay" className="h-9 w-9 rounded-xl" />
          <span className="text-2xl font-semibold tracking-tight text-white">Bay</span>
        </div>
        <p className="text-sm text-slate-300">Find real parking, everywhere.</p>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-8 pt-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Where are you parking?</h1>
          <p className="text-sm text-slate-500">Search any city or suburb, worldwide.</p>
        </div>

        <div>
          <button
            onClick={handleUseGps}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" strokeWidth={2} />}
            {locating ? 'Locating…' : 'Use my current location'}
          </button>
          {gpsError && (
            <p className="mt-2 flex items-start gap-1.5 text-left text-xs text-rose-600">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {gpsError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or choose manually</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-3 text-left">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500">Country</label>
              <div className="relative mt-1">
                <select
                  value={countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {states.length > 0 && (
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">State / region</label>
                <div className="relative mt-1">
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  >
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            )}
          </div>

          <div ref={boxRef} className="relative">
            <label className="text-xs font-medium text-slate-500">City</label>
            <div className="relative mt-1">
              {searching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
              ) : (
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              )}
              <input
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for a city or suburb"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
            {showSuggestions && citySearch.trim() && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {!searching && results.length === 0 && <p className="px-3 py-2.5 text-sm text-slate-400">No matches. Try a different spelling.</p>}
                {results.map((c, i) => (
                  <button
                    key={`${c.name}-${c.lat}-${c.lng}-${i}`}
                    onClick={() => selectCity(c)}
                    className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {c.name} {c.stateName && <span className="text-slate-400">· {c.stateName}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
