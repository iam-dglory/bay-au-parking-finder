import { Car, CircleCheck, Clock } from 'lucide-react'
import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { getOccupancyInfo, formatOccupancyAge } from '../lib/occupancy'
import { getClaimInfo } from '../lib/claims'

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
  const occupancy = getOccupancyInfo(spot.latest_ping)
  const claim = getClaimInfo(spot.latest_claim)
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{spot.address_text}</p>
          <p className="text-sm text-slate-500">
            {[spot.suburb, spot.state].filter(Boolean).join(', ') || spot.country || ''} · {formatDistance(spot.distance_m)}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={spot.status} />
        {occupancy.status !== 'unknown' && (
          <span className={`inline-flex items-center gap-1 text-xs ${occupancy.status === 'occupied' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {occupancy.status === 'occupied' ? <Car className="h-3.5 w-3.5" strokeWidth={2} /> : <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />}
            {formatOccupancyAge(occupancy.ageMinutes!)}
          </span>
        )}
        {claim.active && (
          <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            Claimed · {claim.minutesLeft}m left
          </span>
        )}
      </div>
    </button>
  )
}
