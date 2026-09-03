import type { ParkingSpot, SpotStatus } from '../types'
import { StatusBadge } from './StatusBadge'
import { SIGN_TYPE_LABELS } from '../types'

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
}: {
  spot: (ParkingSpot & { status: SpotStatus }) | null
  onClose: () => void
}) {
  if (!spot) return null
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{spot.address_text}</h2>
            <p className="text-sm text-slate-500">
              {spot.suburb ? `${spot.suburb}, ` : ''}
              {spot.state}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-3">
          <StatusBadge status={spot.status} />
        </div>

        <p className="mt-3 text-sm text-slate-600">{spot.status.detail}</p>

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
              {rule.price_per_hour != null && <p className="text-slate-500">${rule.price_per_hour.toFixed(2)}/hr</p>}
              {rule.notes && <p className="mt-1 text-slate-400 italic">{rule.notes}</p>}
            </div>
          ))}
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block w-full rounded-xl bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-800"
        >
          Get directions
        </a>
      </div>
    </div>
  )
}
