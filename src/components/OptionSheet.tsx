import { useState } from 'react'
import { BellRing, CarFront, Clock3, ExternalLink, MapPin, Navigation, Radio, TriangleAlert, X } from 'lucide-react'
import { REMIND_BEFORE_MINUTES, startParking, type ReminderResult } from '../lib/parkingTimer'
import type { ParkingOption } from '../lib/parkingOptions'
import { directionsUrl, shortStreetName, splitStreet, walkMinutes } from '../lib/parkingOptions'
import { formatCents, formatDurationShort } from '../lib/parkingCost'
import { trackEvent } from '../lib/analytics'

const clock = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Detail for one street or car park: total for the stay, leave-by time, how
 * the price is made up, live sensor readings and where the price came from. */
export function OptionSheet({ option, durationMinutes, arrival, onClose }: { option: ParkingOption | null; durationMinutes: number; arrival: Date; onClose: () => void }) {
  const [reminder, setReminder] = useState<ReminderResult | 'starting' | null>(null)
  if (!option) return null
  const leaveAt = new Date(arrival.getTime() + durationMinutes * 60_000)
  const limitAt = option.limitMinutes != null ? new Date(arrival.getTime() + option.limitMinutes * 60_000) : null
  const price = option.cents != null ? formatCents(option.cents) : option.range ? `${formatCents(option.range.min)}–${formatCents(option.range.max)}` : 'Price not listed'
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/25 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={`${option.name} parking cost`} className="bay-sheet max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
        <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]">{option.kind === 'carpark' ? <CarFront className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#1769ff]">{option.kind === 'carpark' ? `${option.operator} car park` : `Street parking · ${option.bayCount} bay${option.bayCount === 1 ? '' : 's'}`}</p>
            <h2 className="mt-0.5 text-lg font-bold leading-snug text-[#0b1730] [text-wrap:balance]">{option.kind === 'street' ? splitStreet(option.name).title : option.name}</h2>
            <p className="text-xs text-[#64748b]">{option.kind === 'street' && splitStreet(option.name).block ? `${splitStreet(option.name).block} · ` : ''}{walkMinutes(option.distanceM)} min walk</p>
          </div>
          <button onClick={onClose} className="bay-icon-button h-10 w-10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <section className="mt-5 rounded-[24px] bg-[#f5f8ff] p-5 shadow-[inset_0_0_0_1px_rgba(23,105,255,.12)]">
          <p className="text-sm font-semibold text-[#40516d]">{formatDurationShort(durationMinutes)} from {clock(arrival)}</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#0b1730] tabular-nums">{option.fits === false ? 'Not allowed' : price}</p>
          {option.rateName && option.fits !== false && <p className="mt-1 text-sm text-[#64748b]">{option.rateName}</p>}
          {option.fits === false && limitAt && <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#b45309]"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />Time limit is {formatDurationShort(option.limitMinutes!)} here. You'd have to leave by {clock(limitAt)}.</p>}
          {option.fits !== false && <p className="mt-3 flex items-center gap-2 text-sm text-[#0b1730]"><Clock3 className="h-4 w-4 text-[#1769ff]" />Leave by <strong>{clock(limitAt && limitAt < leaveAt ? limitAt : leaveAt)}</strong>{option.limitMinutes != null && <span className="text-[#64748b]">· {formatDurationShort(option.limitMinutes)} limit</span>}</p>}
        </section>

        {option.segments && option.segments.length > 0 && (
          <section className="mt-4">
            <p className="text-sm font-semibold text-[#40516d]">How it adds up</p>
            <ul className="mt-2 divide-y divide-[#eef2f7] text-sm">
              {option.segments.map(seg => (
                <li key={seg.fromMinute} className="flex justify-between py-2 tabular-nums">
                  <span>{clock(new Date(arrival.getTime() + seg.fromMinute * 60_000))}–{clock(new Date(arrival.getTime() + seg.toMinute * 60_000))}</span>
                  <span className="font-semibold">{formatCents(seg.centsPerHour)}/hr</span>
                </li>
              ))}
              {option.cents != null && <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCents(option.cents)}</span></li>}
            </ul>
          </section>
        )}

        {option.live && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] px-3 py-2.5 text-sm text-[#065f46]">
            <Radio className="h-4 w-4 shrink-0" />{option.live.free} of {option.live.reporting} sensor bays free now (council sensors, last few minutes)
          </p>
        )}
        {option.notes && <p className="mt-3 text-sm text-[#64748b]">{option.notes}</p>}

        <a href={directionsUrl(option.lat, option.lng)} target="_blank" rel="noreferrer" onClick={() => trackEvent('directions_open', { result_type: option.kind })}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#1769ff] text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,105,255,.3)] transition-transform active:scale-[0.98]">
          <Navigation className="h-4 w-4" />Directions
        </a>
        {option.fits !== false && (
          <button
            disabled={reminder === 'starting'}
            onClick={async () => {
              setReminder('starting')
              const leaveBy = limitAt && limitAt < leaveAt ? limitAt : leaveAt
              const result = await startParking({
                name: option.kind === 'street' ? shortStreetName(option.name) : option.name,
                lat: option.lat, lng: option.lng, kind: option.kind,
                startedAt: arrival.toISOString(), leaveBy: leaveBy.toISOString(),
                limitAt: limitAt?.toISOString(), cents: option.cents,
              })
              setReminder(result)
            }}
            className="mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#eef4ff] text-sm font-bold text-[#1769ff] transition-transform active:scale-[0.98] disabled:opacity-60">
            <BellRing className="h-4 w-4" />{reminder && reminder !== 'starting' ? 'Timer started' : "I've parked here · remind me"}
          </button>
        )}
        {reminder === 'scheduled' && <p role="status" className="mt-2 text-xs text-[#065f46]">We'll remind you {REMIND_BEFORE_MINUTES} minutes before, and when time is up.</p>}
        {reminder === 'in-app-only' && <p role="status" className="mt-2 text-xs text-[#64748b]">Timer started. In a browser, reminders only appear while Bay is open in a tab.</p>}
        {reminder === 'denied' && <p role="status" className="mt-2 text-xs text-[#b45309]">Timer started, but notifications are off for Bay, so watch the countdown on the home screen.</p>}


        <p className="mt-5 text-xs leading-5 text-[#64748b] [text-wrap:pretty]">
          {option.kind === 'carpark' ? 'Drive-up rate' : 'Council rate'} from {option.source.url ? <a href={option.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[#40516d] underline">{option.source.label}<ExternalLink className="h-3 w-3" /></a> : option.source.label}
          {option.source.date && <>, checked {dateLabel(option.source.date)}</>}{option.source.stale && <strong className="text-[#b45309]"> (may be out of date)</strong>}.
          {' '}Rates can change. The sign at the bay or the car park entrance is what applies.
        </p>
      </div>
    </div>
  )
}
