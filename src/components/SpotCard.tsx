import { AvailabilityBadge } from './AvailabilityBadge'
import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { formatChangesAt } from '../lib/parkingStatus'


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
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{spot.address_text}</p>
          <p className="text-sm text-slate-500">
            {[spot.suburb, spot.state].filter(Boolean).join(', ') || spot.country || ''} · {formatDistance(spot.distance_m)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={spot.status} />
        <AvailabilityBadge spot={spot} />
      </div>
      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Parking terms</span>
          {formatChangesAt(spot.status) && <span className="text-[11px] font-semibold text-slate-500">{formatChangesAt(spot.status)}</span>}
        </div>
        <p className="mt-1 text-xs font-medium text-slate-700">{spot.status.detail}</p>
        {spot.rules.length > 1 && <p className="mt-1 text-[11px] text-slate-500">{spot.rules.length} signed time periods · open to see the full schedule</p>}
      </div>
    </button>
  )
}
