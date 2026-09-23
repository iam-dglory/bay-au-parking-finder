import { Car, CircleCheck, Radio } from 'lucide-react'
import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { getOccupancyInfo, getSensorOccupancyInfo, formatOccupancyAge, formatMinutesAgo, OCCUPANCY_CORROBORATION_THRESHOLD } from '../lib/occupancy'

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
  const confirmed = occupancy.corroboratingCount >= OCCUPANCY_CORROBORATION_THRESHOLD
  const sensor = getSensorOccupancyInfo(spot.sensor_status)
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
        {sensor && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              sensor.possiblyStuck ? 'text-amber-600' : sensor.status === 'occupied' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            <Radio className="h-3.5 w-3.5" strokeWidth={2} />
            Live sensor: {sensor.status === 'occupied' ? 'Occupied' : 'Free'} · confirmed {formatMinutesAgo(sensor.confirmedAgoMinutes)}
            {sensor.possiblyStuck ? ' (offline)' : ''}
          </span>
        )}
        {/* Independent of the sensor badge -- see SpotDetailSheet for why. */}
        {occupancy.status !== 'unknown' && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              !confirmed ? 'text-amber-600' : occupancy.status === 'occupied' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {occupancy.status === 'occupied' ? <Car className="h-3.5 w-3.5" strokeWidth={2} /> : <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} />}
            {confirmed ? 'Confirmed' : 'Unconfirmed'} · {formatOccupancyAge(occupancy.ageMinutes!)}
          </span>
        )}
      </div>
    </button>
  )
}
