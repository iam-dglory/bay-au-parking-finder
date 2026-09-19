import { useState } from 'react'
import { X, Car, CircleCheck, Navigation } from 'lucide-react'
import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { SIGN_TYPE_LABELS } from '../types'
import { formatMoney } from '../lib/money'
import { logVisit } from '../lib/visits'
import { getOccupancyInfo, formatOccupancyAge, submitOccupancyPing } from '../lib/occupancy'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDays(days: number[]) {
  if (days.length === 7) return 'Every day'
  return days
    .slice()
    .sort()
    .map((d) => DAY_NAMES[d])
    .join(', ')
}

function formatTimeStr(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${period}`
}

export function SpotDetailSheet({
  spot,
  onClose,
  onPingSubmitted,
}: {
  spot: (ParkingSpot & { status: SpotStatus }) | null
  onClose: () => void
  onPingSubmitted?: () => void
}) {
  const [pinging, setPinging] = useState(false)

  if (!spot) return null
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
  const occupancy = getOccupancyInfo(spot.latest_ping)

  async function handlePing(status: 'occupied' | 'free') {
    setPinging(true)
    await submitOccupancyPing(spot!.id, status)
    setPinging(false)
    onPingSubmitted?.()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{spot.address_text}</h2>
            <p className="text-sm text-slate-500">{[spot.suburb, spot.state, spot.country].filter(Boolean).join(', ')}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={spot.status} />
          {occupancy.status === 'occupied' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
              <Car className="h-3.5 w-3.5" strokeWidth={2} /> Reported occupied · {formatOccupancyAge(occupancy.ageMinutes!)}
            </span>
          )}
          {occupancy.status === 'free' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} /> Reported free · {formatOccupancyAge(occupancy.ageMinutes!)}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-600">{spot.status.detail}</p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handlePing('occupied')}
            disabled={pinging}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Car className="h-3.5 w-3.5" strokeWidth={2} /> Mark occupied
          </button>
          <button
            onClick={() => handlePing('free')}
            disabled={pinging}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} /> Mark free
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Signed rules</h3>
          {spot.rules.length === 0 && <p className="text-sm text-slate-500">No rules recorded yet.</p>}
          {spot.rules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-slate-200 p-2.5 text-sm">
              <p className="font-medium text-slate-800">{SIGN_TYPE_LABELS[rule.sign_type]}</p>
              <p className="text-slate-500">
                {formatDays(rule.days_active)}
                {rule.time_from && rule.time_to ? ` · ${formatTimeStr(rule.time_from)}–${formatTimeStr(rule.time_to)}` : ''}
              </p>
              {rule.max_stay_minutes && <p className="text-slate-500">Max stay: {rule.max_stay_minutes / 60}h</p>}
              {rule.price_per_hour != null && <p className="text-slate-500">{formatMoney(rule.currency ?? 'USD', rule.price_per_hour)}/hr</p>}
              {rule.notes && <p className="mt-1 text-slate-400 italic">{rule.notes}</p>}
            </div>
          ))}
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => logVisit(spot.id, spot.address_text, spot.country)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-800"
        >
          <Navigation className="h-4 w-4" strokeWidth={2} />
          Get directions
        </a>
      </div>
    </div>
  )
}
