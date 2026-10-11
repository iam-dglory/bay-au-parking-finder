import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { MapPin, Plus, ClipboardList, BookOpen } from 'lucide-react'
import { FeedbackForm } from './components/FeedbackForm'
import { LocationPicker } from './components/LocationPicker'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ensureSession } from './lib/supabaseClient'
import { getBrowserLocation, watchLocation } from './lib/geolocation'
import { reverseGeocodeLabel } from './lib/geocoding'
import { loadSavedLocations, rememberLocation, savedStartupLocation, type SavedLocation, type SavedPlaceKind } from './lib/savedLocations'

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })))
const AddSpot = lazy(() => import('./pages/AddSpot').then((module) => ({ default: module.AddSpot })))
const MyActivity = lazy(() => import('./pages/MyActivity').then((module) => ({ default: module.MyActivity })))
const Guide = lazy(() => import('./pages/Guide').then((module) => ({ default: module.Guide })))

type Tab = 'home' | 'addSign' | 'mine' | 'guide'
type Location = SavedLocation
type LocationStatus = 'detecting' | 'resolved' | 'manual'

const LOCATION_DETECT_TIMEOUT_MS = 6000

export default function App() {
  const gpsEpoch = useRef(0)
  const needsRefinement = useRef(false)
  const initialSaved = useRef(loadSavedLocations())
  const [authReady, setAuthReady] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [location, setLocation] = useState<Location | null>(() => savedStartupLocation(initialSaved.current))
  const [savedLocations, setSavedLocations] = useState(() => initialSaved.current)
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [trackLive, setTrackLive] = useState(false)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => savedStartupLocation(initialSaved.current) ? 'resolved' : 'detecting')
  const [tab, setTab] = useState<Tab>('home')
  const [addKey, setAddKey] = useState(0)
  const [showFeedback, setShowFeedback] = useState(() => new URLSearchParams(window.location.search).get('feedback') === '1')

  useEffect(() => {
    ensureSession()
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  // Keep the welcome moment brief. Location and saved-place restoration continue
  // in parallel, so the logo reveal does not add a second loading step.
  useEffect(() => {
    const timer = window.setTimeout(() => setIntroComplete(true), 1650)
    return () => window.clearTimeout(timer)
  }, [])

  /** Shows the dashboard the moment GPS resolves, with a plain fallback
   * label, then fills in the real street address a moment later once
   * reverse-geocoding finishes -- rather than making the whole app wait on
   * two sequential network calls before showing anything. */
  function resolveGpsThenRefineLabel(onResolved: (loc: Location) => void) {
    const epoch = ++gpsEpoch.current
    return getBrowserLocation().then((pos) => {
      if (epoch !== gpsEpoch.current) return
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      needsRefinement.current = (pos.coords.accuracy ?? Infinity) > 200
      onResolved({ lat, lng, label: needsRefinement.current ? 'Approximate current location' : 'Current location' })
      setLiveLocation({ lat, lng })
      setTrackLive(true)
      reverseGeocodeLabel(lat, lng).then((label) => {
        if (label && epoch === gpsEpoch.current) setCurrentLocation({ lat, lng, label })
      })
    })
  }

  // Keeps the map's "you are here" dot moving live while driving, e.g. after
  // a GPS-resolved location. A manually picked city (trackLive = false)
  // shouldn't show a live dot drifting to the device's real position, which
  // could be nowhere near the chosen city.
  useEffect(() => {
    if (!trackLive) return
    return watchLocation((pos) => {
      const point = { lat: pos.latitude, lng: pos.longitude }
      setLiveLocation(point)
      if (needsRefinement.current && (pos.accuracy ?? Infinity) <= 200) {
        needsRefinement.current = false
        setCurrentLocation({ ...point, label: 'Current location' })
        const epoch = gpsEpoch.current
        void reverseGeocodeLabel(point.lat, point.lng).then(label => {
          if (label && epoch === gpsEpoch.current) setCurrentLocation({ ...point, label })
        })
      }
    })
  }, [trackLive])

  function setCurrentLocation(next: Location, saveAs?: SavedPlaceKind) {
    setLocation(next)
    setSavedLocations(rememberLocation(next, saveAs))
    setLocationStatus('resolved')
  }

  useEffect(() => {
    // A deliberate home or last-search choice wins over a new GPS lookup.
    // It avoids a denied/slow Indian fix reopening Melbourne on every launch.
    if (savedStartupLocation(initialSaved.current)) return
    let settled = false
    const startupEpoch = gpsEpoch.current + 1
    const timeout = setTimeout(() => {
      if (!settled && gpsEpoch.current === startupEpoch) {
        settled = true
        gpsEpoch.current++
        setLocationStatus('manual')
      }
    }, LOCATION_DETECT_TIMEOUT_MS)

    resolveGpsThenRefineLabel((resolved) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setCurrentLocation(resolved)
    }).catch(() => {
      if (settled || gpsEpoch.current !== startupEpoch) return
      settled = true
      clearTimeout(timeout)
      setLocationStatus('manual')
    })

    // This ref is a cancellation token, not a DOM node.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return () => { clearTimeout(timeout); gpsEpoch.current++ }
  // Startup state is intentionally read once. Location changes below are
  // user actions and must not restart the native permission request.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!introComplete) return <WelcomeScreen />

  const feedbackOverlay = showFeedback && authReady && <FeedbackForm pageContext={tab} onClose={() => setShowFeedback(false)} />

  if (locationStatus === 'detecting') {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f6f8fc] text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-xl shadow-blue-600/25"><MapPin className="h-7 w-7 animate-pulse text-white" strokeWidth={1.8} /></div>
          <div><p className="text-base font-semibold text-slate-900">Finding your parking area</p><p className="mt-1 text-sm text-slate-500">Allow location access for the fastest results</p></div>
        <button className="mt-3 text-sm font-semibold text-blue-600" onClick={() => { gpsEpoch.current++; setLocationStatus('manual') }}>Choose an area instead</button>
        </div>
        {feedbackOverlay}
      </>
    )
  }

  if (locationStatus === 'manual' || !location) {
    return (
      <>
        <LocationPicker
          onPick={(lat, lng, label, country) => {
            gpsEpoch.current++
            needsRefinement.current = false
            setTrackLive(false)
            setLiveLocation(null)
            setCurrentLocation({ lat, lng, label, country })
          }}
          onUseGps={() =>
            resolveGpsThenRefineLabel((resolved) => {
              setCurrentLocation(resolved)
            })
          }
        />
        {feedbackOverlay}
      </>
    )
  }

  function goHome() {
    setAddKey((k) => k + 1)
    setTab('home')
  }

  return (
    <div className="flex h-full flex-col bg-[#f6f8fc]">
      <div className="min-h-0 flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Opening Bay…</div>}>
        {tab === 'home' && (
          <Home
            center={location}
            myLocation={liveLocation ?? undefined}
            locationLabel={location.label}
            savedLocations={savedLocations}
            onSavePlace={(kind) => setSavedLocations(rememberLocation(location, kind))}
            onSelectSavedPlace={(kind) => {
              const place = savedLocations[kind]
              if (!place) return
              gpsEpoch.current++
              needsRefinement.current = false
              setTrackLive(false)
              setLiveLocation(null)
              setCurrentLocation(place)
            }}
            onChangeLocation={() => { gpsEpoch.current++; setTrackLive(false); setLocationStatus('manual') }}
          />
        )}
        {tab === 'addSign' && <AddSpot key={addKey} center={location} onDone={goHome} />}
        {tab === 'mine' && <MyActivity center={location} onOpenFeedback={() => setShowFeedback(true)} />}
        {tab === 'guide' && <Guide location={location} />}
        </Suspense>
      </div>

      <nav className="mx-2 mb-1 flex shrink-0 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(30,64,175,0.10)] backdrop-blur sm:mx-5 sm:mb-3">
        <button
          onClick={() => setTab('home')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <MapPin className="h-5 w-5" strokeWidth={1.75} />
          Find parking
        </button>
        <button
          onClick={() => {
            setAddKey((k) => k + 1)
            setTab('addSign')
          }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === 'addSign' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
          Add a sign
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === 'mine' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
          My activity
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === 'guide' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          Guide
        </button>
      </nav>
      {feedbackOverlay}
    </div>
  )
}
