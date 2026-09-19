import { useMemo, useState } from 'react'
import { MapPin, Pencil } from 'lucide-react'
import { MapView } from '../components/MapView'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { FilterBar } from '../components/FilterBar'
import { useNearbyParking } from '../lib/useNearbyParking'
import { rankSpots } from '../lib/parkingStatus'
import type { ParkingSpot, SpotStatus } from '../types'

export function Home({
  center,
  locationLabel,
  onChangeLocation,
}: {
  center: { lat: number; lng: number }
  locationLabel: string
  onChangeLocation: () => void
}) {
  const [radiusM, setRadiusM] = useState(1000)
  const [freeOnly, setFreeOnly] = useState(false)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selectedSpot, setSelectedSpot] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  const { spots, loading, error, refresh } = useNearbyParking(center, radiusM)

  const ranked = useMemo(() => {
    const all = rankSpots(spots)
    return freeOnly ? all.filter((s) => s.status.status === 'free') : all
  }, [spots, freeOnly])

  const selected = selectedSpot ? ranked.find((s) => s.id === selectedSpot.id) ?? selectedSpot : null

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">Bay</span>
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

        <button onClick={onChangeLocation} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900" aria-label="Change location">
          <MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
          {locationLabel}
          <Pencil className="h-3 w-3 text-slate-400" strokeWidth={2} />
        </button>
        <p className="text-xs text-slate-500">{ranked.length} spots found</p>
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
          <MapView center={center} spots={ranked} onSelectSpot={setSelectedSpot} />
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

      <SpotDetailSheet spot={selected} onClose={() => setSelectedSpot(null)} onPingSubmitted={refresh} />
    </div>
  )
}
