import { useMemo, useState } from 'react'
import { MapView } from '../components/MapView'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { ListingCard } from '../components/ListingCard'
import { BookingSheet } from '../components/BookingSheet'
import { FilterBar } from '../components/FilterBar'
import { useNearbyParking } from '../lib/useNearbyParking'
import { useNearbyListings } from '../lib/useNearbyListings'
import { rankSpots } from '../lib/parkingStatus'
import type { Listing, ParkingSpot, SpotStatus } from '../types'

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
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  const { spots, loading, error, refresh } = useNearbyParking(center, radiusM)
  const { listings, refresh: refreshListings } = useNearbyListings(center, radiusM * 2)

  const ranked = useMemo(() => {
    const all = rankSpots(spots)
    return freeOnly ? all.filter((s) => s.status.status === 'free') : all
  }, [spots, freeOnly])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button onClick={onChangeLocation} className="text-left" aria-label="Change location">
          <h1 className="flex items-center gap-1 text-base font-semibold text-slate-900">
            Parking near {locationLabel} <span className="text-xs font-normal text-slate-400">✎</span>
          </h1>
          <p className="text-xs text-slate-500">
            {ranked.length} free spots · {listings.length} bookable
          </p>
        </button>
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
          <MapView center={center} spots={ranked} listings={freeOnly ? [] : listings} onSelectSpot={setSelectedSpot} onSelectListing={setSelectedListing} />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-2">
              {loading && <p className="text-center text-sm text-slate-400">Loading…</p>}
              {!loading && ranked.length === 0 && <p className="text-center text-sm text-slate-400">No free parking spots recorded near here yet.</p>}
              {ranked.map((spot) => (
                <SpotCard key={spot.id} spot={spot} onClick={() => setSelectedSpot(spot)} />
              ))}
            </div>

            {!freeOnly && (
              <div className="mt-6 space-y-2">
                <h2 className="text-sm font-semibold text-slate-700">Bookable parking nearby</h2>
                {listings.length === 0 && <p className="text-sm text-slate-400">No bookable parking areas listed near here yet.</p>}
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SpotDetailSheet spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
      <BookingSheet
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onBooked={() => {
          refreshListings()
        }}
      />
    </div>
  )
}
