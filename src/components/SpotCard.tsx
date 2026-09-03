import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function SpotCard({
  spot,
  onClick,
}: {
  spot: ParkingSpot & { status: SpotStatus }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{spot.address_text}</p>
          <p className="text-sm text-slate-500">
            {spot.suburb ? `${spot.suburb}, ` : ''}
            {spot.state} · {formatDistance(spot.distance_m)}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <StatusBadge status={spot.status} />
      </div>
    </button>
  )
}
