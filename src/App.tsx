import { useEffect, useState } from 'react'
import { Home } from './pages/Home'
import { AddSpot } from './pages/AddSpot'
import { MySpots } from './pages/MySpots'
import { LocationPicker } from './components/LocationPicker'
import { ensureSession } from './lib/supabaseClient'
import { getBrowserLocation } from './lib/cities'

type Tab = 'home' | 'add' | 'mine'
type Location = { lat: number; lng: number; label: string }

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [addKey, setAddKey] = useState(0)

  useEffect(() => {
    ensureSession()
      .catch(() => {})
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    getBrowserLocation()
      .then((pos) => setLocation((prev) => prev ?? { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'you' }))
      .catch(() => {
        /* fall back to manual city picker */
      })
  }, [])

  if (!authReady) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading…</div>
  }

  if (!location) {
    return (
      <LocationPicker
        onPick={(lat, lng, label) => setLocation({ lat, lng, label })}
        onUseGps={() =>
          getBrowserLocation()
            .then((pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'you' }))
            .catch(() => alert('Could not access your location. Pick a city instead.'))
        }
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="min-h-0 flex-1">
        {tab === 'home' && <Home center={location} locationLabel={location.label} />}
        {tab === 'add' && (
          <AddSpot
            key={addKey}
            center={location}
            onDone={() => {
              setAddKey((k) => k + 1)
              setTab('home')
            }}
          />
        )}
        {tab === 'mine' && <MySpots center={location} />}
      </div>

      <nav className="flex shrink-0 border-t border-slate-200 bg-white">
        {(
          [
            { id: 'home', label: 'Find parking', icon: '📍' },
            { id: 'add', label: 'Add a sign', icon: '➕' },
            { id: 'mine', label: 'My reports', icon: '🗂️' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              tab === item.id ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
