import { useEffect, useState } from 'react'
import { Home } from './pages/Home'
import { AddSpot } from './pages/AddSpot'
import { ListSpot } from './pages/ListSpot'
import { MyActivity } from './pages/MyActivity'
import { LocationPicker } from './components/LocationPicker'
import { AddChoiceSheet } from './components/AddChoiceSheet'
import { ensureSession } from './lib/supabaseClient'
import { getBrowserLocation } from './lib/cities'

type Tab = 'home' | 'addSign' | 'listSpot' | 'mine'
type Location = { lat: number; lng: number; label: string }
type LocationStatus = 'detecting' | 'resolved' | 'manual'

const LOCATION_DETECT_TIMEOUT_MS = 7000

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('detecting')
  const [tab, setTab] = useState<Tab>('home')
  const [addKey, setAddKey] = useState(0)
  const [showAddChoice, setShowAddChoice] = useState(false)

  useEffect(() => {
    ensureSession()
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        setLocationStatus('manual')
      }
    }, LOCATION_DETECT_TIMEOUT_MS)

    getBrowserLocation()
      .then((pos) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'you' })
        setLocationStatus('resolved')
      })
      .catch(() => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        setLocationStatus('manual')
      })

    return () => clearTimeout(timeout)
  }, [])

  if (!authReady) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>
  }

  if (locationStatus === 'detecting') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="animate-pulse text-4xl">📍</span>
        <p className="text-sm font-medium text-slate-700">Finding you…</p>
        <p className="text-xs text-slate-400">Allow location access for the fastest results</p>
      </div>
    )
  }

  if (locationStatus === 'manual' || !location) {
    return (
      <LocationPicker
        onPick={(lat, lng, label) => {
          setLocation({ lat, lng, label })
          setLocationStatus('resolved')
        }}
        onUseGps={() =>
          getBrowserLocation()
            .then((pos) => {
              setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'you' })
              setLocationStatus('resolved')
            })
            .catch(() => alert('Could not access your location. Pick a city instead.'))
        }
      />
    )
  }

  function goHome() {
    setAddKey((k) => k + 1)
    setTab('home')
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="min-h-0 flex-1">
        {tab === 'home' && <Home center={location} locationLabel={location.label} onChangeLocation={() => setLocationStatus('manual')} />}
        {tab === 'addSign' && <AddSpot key={addKey} center={location} onDone={goHome} />}
        {tab === 'listSpot' && <ListSpot key={addKey} center={location} onDone={goHome} />}
        {tab === 'mine' && <MyActivity center={location} />}
      </div>

      <nav className="flex shrink-0 border-t border-slate-200 bg-white">
        <button
          onClick={() => setTab('home')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <span className="text-lg leading-none">📍</span>
          Find parking
        </button>
        <button
          onClick={() => setShowAddChoice(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
            tab === 'addSign' || tab === 'listSpot' ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <span className="text-lg leading-none">➕</span>
          Add
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === 'mine' ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <span className="text-lg leading-none">🗂️</span>
          My activity
        </button>
      </nav>

      {showAddChoice && (
        <AddChoiceSheet
          onChooseSign={() => {
            setShowAddChoice(false)
            setAddKey((k) => k + 1)
            setTab('addSign')
          }}
          onChooseListing={() => {
            setShowAddChoice(false)
            setAddKey((k) => k + 1)
            setTab('listSpot')
          }}
          onClose={() => setShowAddChoice(false)}
        />
      )}
    </div>
  )
}
