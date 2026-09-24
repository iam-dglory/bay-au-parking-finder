import { useEffect, useState } from 'react'
import { MapPin, Plus, ClipboardList, BookOpen } from 'lucide-react'
import { Home } from './pages/Home'
import { AddSpot } from './pages/AddSpot'
import { MyActivity } from './pages/MyActivity'
import { Guide } from './pages/Guide'
import { FeedbackForm } from './components/FeedbackForm'
import { LocationPicker } from './components/LocationPicker'
import { ensureSession } from './lib/supabaseClient'
import { getBrowserLocation, watchLocation } from './lib/geolocation'
import { reverseGeocodeLabel } from './lib/geocoding'
import { getTesterNumber } from './lib/tester'

type Tab = 'home' | 'addSign' | 'mine' | 'guide'
type Location = { lat: number; lng: number; label: string }
type LocationStatus = 'detecting' | 'resolved' | 'manual'

const LOCATION_DETECT_TIMEOUT_MS = 7000

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [testerNumber, setTesterNumber] = useState<number | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [trackLive, setTrackLive] = useState(false)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('detecting')
  const [tab, setTab] = useState<Tab>('home')
  const [addKey, setAddKey] = useState(0)
  const [showFeedback, setShowFeedback] = useState(() => new URLSearchParams(window.location.search).get('feedback') === '1')

  useEffect(() => {
    ensureSession()
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (!authReady) return
    getTesterNumber().then(setTesterNumber)
  }, [authReady])

  /** Shows the dashboard the moment GPS resolves, with a plain fallback
   * label, then fills in the real street address a moment later once
   * reverse-geocoding finishes -- rather than making the whole app wait on
   * two sequential network calls before showing anything. */
  function resolveGpsThenRefineLabel(onResolved: (loc: Location) => void) {
    return getBrowserLocation().then((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      onResolved({ lat, lng, label: 'Current location' })
      setLiveLocation({ lat, lng })
      setTrackLive(true)
      reverseGeocodeLabel(lat, lng).then((label) => {
        if (label) setLocation((prev) => (prev && prev.lat === lat && prev.lng === lng ? { ...prev, label } : prev))
      })
    })
  }

  // Keeps the map's "you are here" dot moving live while driving, e.g. after
  // a GPS-resolved location. A manually picked city (trackLive = false)
  // shouldn't show a live dot drifting to the device's real position, which
  // could be nowhere near the chosen city.
  useEffect(() => {
    if (!trackLive) return
    return watchLocation((pos) => setLiveLocation({ lat: pos.latitude, lng: pos.longitude }))
  }, [trackLive])

  useEffect(() => {
    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        setLocationStatus('manual')
      }
    }, LOCATION_DETECT_TIMEOUT_MS)

    resolveGpsThenRefineLabel((resolved) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setLocation(resolved)
      setLocationStatus('resolved')
    }).catch(() => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setLocationStatus('manual')
    })

    return () => clearTimeout(timeout)
  }, [])

  const feedbackOverlay = showFeedback && authReady && <FeedbackForm pageContext={tab} onClose={() => setShowFeedback(false)} />

  if (!authReady) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>
  }

  if (locationStatus === 'detecting') {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <MapPin className="h-9 w-9 animate-pulse text-slate-900" strokeWidth={1.75} />
          <p className="text-sm font-medium text-slate-700">Finding you…</p>
          <p className="text-xs text-slate-400">Allow location access for the fastest results</p>
        </div>
        {feedbackOverlay}
      </>
    )
  }

  if (locationStatus === 'manual' || !location) {
    return (
      <>
        <LocationPicker
          onPick={(lat, lng, label) => {
            setTrackLive(false)
            setLiveLocation(null)
            setLocation({ lat, lng, label })
            setLocationStatus('resolved')
          }}
          onUseGps={() =>
            resolveGpsThenRefineLabel((resolved) => {
              setLocation(resolved)
              setLocationStatus('resolved')
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
    <div className="flex h-full flex-col bg-slate-50">
      <div className="min-h-0 flex-1">
        {tab === 'home' && (
          <Home
            center={location}
            myLocation={liveLocation ?? undefined}
            locationLabel={location.label}
            testerNumber={testerNumber}
            onChangeLocation={() => setLocationStatus('manual')}
          />
        )}
        {tab === 'addSign' && <AddSpot key={addKey} center={location} onDone={goHome} />}
        {tab === 'mine' && <MyActivity center={location} onOpenFeedback={() => setShowFeedback(true)} />}
        {tab === 'guide' && <Guide location={location} />}
      </div>

      <nav className="flex shrink-0 border-t border-slate-200 bg-white">
        <button
          onClick={() => setTab('home')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <MapPin className="h-5 w-5" strokeWidth={1.75} />
          Find parking
        </button>
        <button
          onClick={() => {
            setAddKey((k) => k + 1)
            setTab('addSign')
          }}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'addSign' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
          Add a sign
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'mine' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
          My activity
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'guide' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          Guide
        </button>
      </nav>
      {feedbackOverlay}
    </div>
  )
}
