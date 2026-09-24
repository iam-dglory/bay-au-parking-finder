import { useState } from 'react'
import { X, Car, CircleCheck, Navigation, TriangleAlert, Clock3, Info, Camera as CameraIcon, Radio } from 'lucide-react'
import type { ParkingSpot, SpotStatus } from '../types'
import { AvailabilityBadge } from './AvailabilityBadge'
import { StatusBadge } from './StatusBadge'
import { SIGN_TYPE_LABELS } from '../types'
import { formatMoney } from '../lib/money'
import { logVisit } from '../lib/visits'
import {
  getOccupancyInfo,
  getSensorOccupancyInfo,
  formatOccupancyAge,
  formatMinutesAgo,
  formatCorroboration,
  submitOccupancyPing,
  TooFarAwayError,
  OCCUPANCY_PROXIMITY_METERS,
  OCCUPANCY_CORROBORATION_THRESHOLD,
} from '../lib/occupancy'
import { getBrowserLocation, LocationError } from '../lib/geolocation'
import { formatMaxStay } from '../lib/formatDuration'
import { formatChangesAt } from '../lib/parkingStatus'
import { haversineMeters } from '../lib/distance'
import { captureSignPhoto, uploadSignPhoto, type CapturedPhoto } from '../lib/photos'

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
  onUpdated,
}: {
  spot: (ParkingSpot & { status: SpotStatus }) | null
  onClose: () => void
  onUpdated?: () => void
}) {
  const [pinging, setPinging] = useState(false)
  const [pingError, setPingError] = useState<string | null>(null)
  const [attachedPhoto, setAttachedPhoto] = useState<CapturedPhoto | null>(null)
  const [capturingPhoto, setCapturingPhoto] = useState(false)

  if (!spot) return null
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
  const occupancy = getOccupancyInfo(spot.latest_ping)
  const confirmed = occupancy.corroboratingCount >= OCCUPANCY_CORROBORATION_THRESHOLD
  const corroboration = formatCorroboration(occupancy.corroboratingCount)
  const sensor = getSensorOccupancyInfo(spot.sensor_status)

  async function handleAttachPhoto() {
    setCapturingPhoto(true)
    const captured = await captureSignPhoto('Photo as proof (optional)')
    if (captured) setAttachedPhoto(captured)
    setCapturingPhoto(false)
  }

  async function handlePing(status: 'occupied' | 'free') {
    setPinging(true)
    setPingError(null)
    try {
      const pos = await getBrowserLocation()
      const reporterLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      if (haversineMeters({ lat: spot!.lat, lng: spot!.lng }, reporterLocation) > OCCUPANCY_PROXIMITY_METERS) {
        throw new TooFarAwayError()
      }

      const photoUrl = attachedPhoto ? await uploadSignPhoto(attachedPhoto) : undefined
      await submitOccupancyPing(spot!.id, status, { lat: spot!.lat, lng: spot!.lng }, reporterLocation, photoUrl)
      setAttachedPhoto(null)
      onUpdated?.()
    } catch (err) {
      if (err instanceof LocationError) {
        setPingError("Couldn't confirm your location. Check location access and try again.")
      } else if (err instanceof Error) {
        setPingError(err.message)
      } else {
        setPingError('Something went wrong. Try again.')
      }
    } finally {
      setPinging(false)
    }
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
            {spot.kerbside_id && (
              <p className="mt-1 text-xs font-medium text-slate-400">
                Council bay ref: <span className="text-slate-600">{spot.kerbside_id}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {spot.moderation_status !== 'approved' && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {spot.moderation_status === 'pending'
              ? "Pending review. Only you can see this until it's approved."
              : "Not approved. This sign isn't shown publicly. Check the photo matches a real, current sign."}
          </p>
        )}

        {spot.photo_url && (
          <img src={spot.photo_url} alt="Photo of the parking sign" className="mt-3 h-40 w-full rounded-lg object-cover" />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={spot.status} />
          <AvailabilityBadge spot={spot} />
          {sensor && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                sensor.possiblyStuck
                  ? 'border border-amber-300 bg-amber-50 text-amber-700'
                  : sensor.status === 'occupied'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Radio className="h-3.5 w-3.5" strokeWidth={2} />
              Sensor report: {sensor.status === 'occupied' ? 'Occupied' : 'Vacant'} · last heartbeat {formatMinutesAgo(sensor.confirmedAgoMinutes)}
              {sensor.possiblyStuck ? ' · outdated; do not rely on it' : ''}
            </span>
          )}
          {/* Shown independently of the sensor badge above -- a sensor can be
              misassigned to the wrong bay or simply wrong, and a driver's own
              recent report is worth seeing even when a sensor also exists,
              not silently swallowed by it. */}
          {occupancy.status === 'occupied' &&
            (confirmed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                <Car className="h-3.5 w-3.5" strokeWidth={2} /> Reports occupied · {formatOccupancyAge(occupancy.ageMinutes!)} · {corroboration}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Car className="h-3.5 w-3.5" strokeWidth={2} /> Unconfirmed report · {formatOccupancyAge(occupancy.ageMinutes!)}
              </span>
            ))}
          {occupancy.status === 'free' &&
            (confirmed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} /> Reports vacant · {formatOccupancyAge(occupancy.ageMinutes!)} · {corroboration}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} /> Unconfirmed report · {formatOccupancyAge(occupancy.ageMinutes!)}
              </span>
            ))}
        </div>

        {occupancy.photoUrl && (
          <img src={occupancy.photoUrl} alt="Photo attached with this report" className="mt-2 h-28 w-full rounded-lg object-cover" />
        )}

        <div className={`mt-4 rounded-2xl border p-4 ${spot.status.status === 'free' ? 'border-emerald-200 bg-emerald-50' : spot.status.status === 'paid' ? 'border-blue-200 bg-blue-50' : spot.status.status === 'restricted' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Right now</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{spot.status.label}</p>
          <p className="mt-1 text-sm text-slate-600">{spot.status.detail}</p>
          {formatChangesAt(spot.status) && <p className="mt-1 text-xs font-semibold text-slate-500">{formatChangesAt(spot.status)}</p>}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handlePing('occupied')}
            disabled={pinging}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Car className="h-3.5 w-3.5" strokeWidth={2} /> Report occupied
          </button>
          <button
            onClick={() => handlePing('free')}
            disabled={pinging}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <CircleCheck className="h-3.5 w-3.5" strokeWidth={2} /> Report vacant
          </button>
        </div>

        {attachedPhoto ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 p-2">
            <img src={attachedPhoto.previewUrl} alt="Photo to attach" className="h-10 w-10 rounded object-cover" />
            <p className="flex-1 text-xs text-slate-500">Photo ready. It'll be added to your next report.</p>
            <button onClick={() => setAttachedPhoto(null)} className="text-xs text-slate-400 hover:text-slate-600">
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={handleAttachPhoto}
            disabled={capturingPhoto}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <CameraIcon className="h-3.5 w-3.5" strokeWidth={2} />
            {capturingPhoto ? 'Opening camera...' : 'Add a photo as proof (optional)'}
          </button>
        )}

        {pingError && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} /> {pingError}
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-400">
          You need to be near this spot to report on it. A report stays unconfirmed until someone else agrees.
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-800">{spot.status.status === 'unknown' ? 'Sign schedule to verify' : 'Sign schedule'}</h3><span className="text-xs text-slate-400">{spot.rules.length} period{spot.rules.length === 1 ? '' : 's'}</span></div>
          {spot.rules.length === 0 && <p className="text-sm text-slate-500">No rules recorded yet.</p>}
          {spot.rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">{SIGN_TYPE_LABELS[rule.sign_type]}</p>
              <p className="text-slate-500">
                {formatDays(rule.days_active)}
                {rule.time_from && rule.time_to ? ` · ${formatTimeStr(rule.time_from)}–${formatTimeStr(rule.time_to)}` : ''}
              </p>
              {rule.max_stay_minutes && <p className="text-slate-500">Max stay: {formatMaxStay(rule.max_stay_minutes)}</p>}
              {rule.price_per_hour != null && <p className="text-slate-500">{formatMoney(rule.currency ?? 'USD', rule.price_per_hour)}/hr</p>}
              {rule.notes && <p className="mt-1 text-slate-400 italic">{rule.notes}</p>}
            </div>
          ))}
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          Community-sourced. Always confirm with the physical sign before parking.
        </p>

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
