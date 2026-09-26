import { Navigation, Clock3, Info } from 'lucide-react'
import type { ParkingSpot, SpotStatus } from '../types'
import { AvailabilityBadge } from './AvailabilityBadge'
import { ParkingAreaDetails } from './ParkingAreaDetails'
import { SIGN_TYPE_LABELS } from '../types'
import { formatMoney } from '../lib/money'
import { logVisit } from '../lib/visits'
import { formatMaxStay } from '../lib/formatDuration'
import { formatChangesAt } from '../lib/parkingStatus'
import { availability, SENSOR_MAX_AGE_MINUTES } from '../lib/availability'
import { MELBOURNE_SENSOR_SOURCE } from '../lib/melbourneSensors'

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

function uniqueRules(rules: ParkingSpot['rules']) {
  const seen = new Set<string>()
  return rules.filter((rule) => {
    const key = [rule.sign_type, rule.max_stay_minutes, rule.days_active.slice().sort().join(','), rule.time_from, rule.time_to, rule.price_per_hour, rule.currency].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function ruleWindow(rule: ParkingSpot['rules'][number]) {
  const days = formatDays(rule.days_active)
  const time = rule.time_from && rule.time_to ? `${formatTimeStr(rule.time_from)}–${formatTimeStr(rule.time_to)}` : 'all day'
  return `${days} · ${time}`
}

function hasLongerStayThanWindow(rule: ParkingSpot['rules'][number]) {
  if (!rule.max_stay_minutes || !rule.time_from || !rule.time_to) return false
  const [fromH, fromM] = rule.time_from.split(':').map(Number)
  const [toH, toM] = rule.time_to.split(':').map(Number)
  let windowMinutes = toH * 60 + toM - (fromH * 60 + fromM)
  if (windowMinutes <= 0) windowMinutes += 24 * 60
  return rule.max_stay_minutes > windowMinutes
}

export function SpotDetailSheet({
  spot,
  onClose,
}: {
  spot: (ParkingSpot & { status: SpotStatus }) | null
  onClose: () => void
  onUpdated?: () => void
}) {
  if (!spot) return null
  if (spot.catalog) return <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}><div role="dialog" aria-label="Parking bay details" className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5" onClick={e=>e.stopPropagation()}><button onClick={onClose} className="mb-3 rounded-full bg-slate-100 px-4 py-2 text-sm">Done</button><ParkingAreaDetails area={spot.catalog} /></div></div>
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        role="dialog" aria-label="Parking bay details"
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{spot.address_text}</h2>
            <p className="text-sm text-slate-500">{[spot.suburb, spot.state, spot.country].filter(Boolean).join(', ')}</p>
            {spot.kerbside_id && (
              <p className="mt-1 text-xs font-medium text-slate-400">
                Council bay ref: <span className="text-slate-600">{spot.kerbside_id}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            Done
          </button>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => { if (spot.created_by !== 'council') logVisit(spot.id, spot.address_text, spot.country) }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-800"
        >
          <Navigation className="h-4 w-4" strokeWidth={2} />
          Get directions
        </a>

        {spot.moderation_status !== 'approved' && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {spot.moderation_status === 'pending'
              ? "Awaiting review. This sign is currently visible only to you."
              : "This sign is currently hidden from the public map while its photo is reviewed."}
          </p>
        )}

        {spot.photo_url && (
          <img src={spot.photo_url} alt="Photo of the parking sign" className="mt-3 h-40 w-full rounded-lg object-cover" />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AvailabilityBadge spot={spot} />
          {availability(spot).state !== 'unknown' && <span className="text-xs text-slate-500">Council sensor · updated {new Date(spot.sensor_status!.last_confirmed_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>}
        </div>
        {availability(spot).state === 'unknown' && <p className="mt-1 text-xs text-slate-500">This location is mapped. Live vacancy is only shown where the council publishes a fresh bay reading.</p>}

        <div className={`mt-4 rounded-2xl border p-4 ${spot.status.status === 'free' ? 'border-emerald-200 bg-emerald-50' : spot.status.status === 'paid' ? 'border-blue-200 bg-blue-50' : spot.status.status === 'restricted' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Can I park here now?</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{spot.status.label}</p>
          <p className="mt-1 text-sm text-slate-600">{spot.status.detail}</p>
          {formatChangesAt(spot.status) && <p className="mt-1 text-xs font-semibold text-slate-500">{formatChangesAt(spot.status)}</p>}
        </div>

        <details className="mt-4 space-y-2">
          <summary className="cursor-pointer text-sm font-bold text-blue-700">Full parking times & prices</summary>
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-800">Parking times</h3><span className="text-xs text-slate-400">{uniqueRules(spot.rules).length} time{uniqueRules(spot.rules).length === 1 ? '' : 's'}</span></div>
          {spot.rules.length === 0 && <p className="text-sm text-slate-500">The parking terms are not recorded. Read the sign at this bay.</p>}
          {uniqueRules(spot.rules).map((rule) => (
            <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">{SIGN_TYPE_LABELS[rule.sign_type]}</p>
              <p className="text-slate-500">{ruleWindow(rule)}</p>
              {rule.max_stay_minutes && <p className="text-slate-500">Max stay: {formatMaxStay(rule.max_stay_minutes)}</p>}
              {hasLongerStayThanWindow(rule) && <p className="mt-1 text-xs font-medium text-amber-700">This maximum stay is longer than the displayed time window. Confirm the sign before relying on it.</p>}
              {rule.price_per_hour != null && <p className="text-slate-500">{formatMoney(rule.currency ?? 'USD', rule.price_per_hour)}/hr</p>}
            </div>
          ))}
        </details>

        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Availability can change before you arrive. The sign at this bay controls parking times and fees.
        </p>

        {spot.sensor_status && <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer">About this reading</summary><p className="mt-1">The council last updated this sensor at {new Date(spot.sensor_status.last_confirmed_at).toLocaleString()}. Bay only shows its vacancy colour when that update and the feed refresh are within {SENSOR_MAX_AGE_MINUTES} minutes, with an exact council bay ID match. A sensor measures vehicle presence; it does not grant parking permission or reserve the bay.</p><a className="mt-1 inline-block text-blue-700 underline" href={MELBOURNE_SENSOR_SOURCE} target="_blank" rel="noreferrer">Council source</a></details>}
      </div>
    </div>
  )
}
