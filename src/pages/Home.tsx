import { useMemo, useState } from 'react'
import { MapView } from '../components/MapView'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { FilterBar } from '../components/FilterBar'
import { useNearbyParking } from '../lib/useNearbyParking'
import { rankSpots } from '../lib/parkingStatus'
import type { ParkingSpot, SpotStatus } from '../types'

export function Home({ center, locationLabel }: { center: { lat: number; lng: number }; locationLabel: string }) {
  const [radiusM, setRadiusM] = useState(1000)
  const [freeOnly, setFreeOnly] = useState(false)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selected, setSelected] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  const { spots, loading, error, refresh } = useNearbyParking(center, radiusM)

  const ranked = useMemo(() => {
    const all = rankSpots(spots)
    return freeOnly ? all.filter((s) => s.status.status === 'free') : all
  }, [spots, freeOnly])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Parking near {locationLabel}</h1>
          <p className="text-xs text-slate-500">{ranked.length} spots found</p>
        </div>
        <div className="flex overflow-hidden rounded-full border border-slate-200 text-sm">
          <button onClick={() => setView('map')} className={`px-3 py-1.5 ${view === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
            Map
          </button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
            List
          </button>
        </div>
      </div>

      <FilterBar radiusM={radiusM} onRadiusChange={setRadiusM} freeOnly={freeOnly} onFreeOnlyChange={setFreeOnly} />

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Could not load parking data: {error}{' '}
          <button onClick={refresh} className="underline">
            retry
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {view === 'map' ? (
          <MapView center={center} spots={ranked} onSelectSpot={setSelected} />
        ) : (
          <div className="h-full space-y-2 overflow-y-auto p-4">
            {loading && <p className="text-center text-sm text-slate-400">Loading…</p>}
            {!loading && ranked.length === 0 && <p className="text-center text-sm text-slate-400">No parking spots recorded near here yet.</p>}
            {ranked.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onClick={() => setSelected(spot)} />
            ))}
          </div>
        )}
      </div>

      <SpotDetailSheet spot={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
