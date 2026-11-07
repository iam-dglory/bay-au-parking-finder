import { useState } from 'react'
import { BellRing, Check, ChevronDown, Clock3, ExternalLink, Flag, Navigation, Radio, Share2, Star, TriangleAlert, X } from 'lucide-react'
import { toggleFavourite, useFavourites } from '../lib/favourites'
import { reportPlaceProblem } from '../lib/feedback'
import { REMIND_BEFORE_MINUTES, startParking, type ReminderResult } from '../lib/parkingTimer'
import type { ParkingOption } from '../lib/parkingOptions'
import { directionsUrl, shortStreetName, splitStreet, walkMinutes } from '../lib/parkingOptions'
import { formatCents, formatDurationShort } from '../lib/parkingCost'
import { trackEvent } from '../lib/analytics'

const clock = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Detail for one street or car park: total for the stay, leave-by time, how
 * the price is made up, live sensor readings and where the price came from. */
export function OptionSheet({ option, durationMinutes, arrival, later = false, onClose }: { option: ParkingOption | null; durationMinutes: number; arrival: Date; later?: boolean; onClose: () => void }) {
  const [reminder, setReminder] = useState<ReminderResult | 'starting' | null>(null)
  const [shared, setShared] = useState(false)
  const favourites = useFavourites()
  if (!option) return null
  const saved = favourites.some(f => f.id === option.id)
  const leaveAt = new Date(arrival.getTime() + durationMinutes * 60_000)
  const limitAt = option.limitMinutes != null ? new Date(arrival.getTime() + option.limitMinutes * 60_000) : null
  const leaveBy = limitAt && limitAt < leaveAt ? limitAt : leaveAt
  const { title, block } = option.kind === 'street' ? splitStreet(option.name) : { title: option.name, block: undefined }
  const kindLabel = option.kind === 'carpark' ? `${option.operator} car park` : `Street parking · ${option.bayCount} bay${option.bayCount === 1 ? '' : 's'}`
  const price = option.cents === 0 ? 'Free' : option.cents != null ? formatCents(option.cents) : option.range ? `${formatCents(option.range.min)}–${formatCents(option.range.max)}` : 'Price not listed'
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/25 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={`${option.name} parking cost`} className="bay-sheet max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
        <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-snug text-[#0b1730] [text-wrap:balance]">{title}</h2>
            <p className="mt-0.5 text-sm text-[#40516d]">{[kindLabel, `${walkMinutes(option.distanceM)} min walk`].join(' · ')}</p>
            {block && <p className="text-xs text-[#64748b]">{block}</p>}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => toggleFavourite({ id: option.id, name: option.kind === 'street' ? shortStreetName(option.name) : option.name, lat: option.lat, lng: option.lng })} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save this place'}
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] transition-colors ${saved ? 'bg-amber-50 text-amber-500' : 'text-[#40516d] hover:bg-[#f5f8ff]'}`}>
              <Star className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button onClick={async () => { if (await sharePlace(option, price, durationMinutes, leaveBy)) { setShared(true); window.setTimeout(() => setShared(false), 2000) } }} aria-label="Share" className="flex h-10 w-10 items-center justify-center rounded-[14px] text-[#40516d] hover:bg-[#f5f8ff]">
              {shared ? <Check className="h-5 w-5 text-[#047857]" /> : <Share2 className="h-5 w-5" />}
            </button>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[14px] text-[#40516d] hover:bg-[#f5f8ff]" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <section className="mt-4 rounded-[24px] bg-[#f5f8ff] p-5 shadow-[inset_0_0_0_1px_rgba(23,105,255,.12)]">
          {option.fits === false ? <>
            <p className="text-2xl font-extrabold tracking-tight text-[#0b1730]">Too short for {formatDurationShort(durationMinutes)}</p>
            {limitAt && <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#b45309]"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />Max stay here is {formatDurationShort(option.limitMinutes!)}. You'd have to leave by {clock(limitAt)}.</p>}
          </> : <>
            <p className="flex flex-wrap items-baseline gap-x-2"><span className="text-4xl font-extrabold tracking-tight text-[#0b1730] tabular-nums">{price}</span><span className="text-sm text-[#40516d]">for {formatDurationShort(durationMinutes)}{later ? `, arriving ${clock(arrival)}` : ''}</span></p>
            {option.kind === 'carpark' && option.rateName && option.rateName !== 'Hourly' && <p className="mt-1 text-sm text-[#40516d]">{option.rateName} rate</p>}
            <div className="mt-3 flex items-start gap-2 text-sm text-[#0b1730]">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#1769ff]" />
              <p className="min-w-0"><span className="whitespace-nowrap">Leave by <strong className="tabular-nums">{clock(leaveBy)}</strong></span>
                {option.limitMinutes != null && <span className="block text-[#64748b]">{option.limitMinutes % 15 === 0 && option.limitMinutes <= 240 ? `Max stay ${formatDurationShort(option.limitMinutes)}` : `You can stay till ${clock(limitAt!)}`}</span>}</p>
            </div>
          </>}
          {option.live && !later && <p className="mt-2 flex items-center gap-2 text-sm text-[#065f46]"><Radio className="h-4 w-4 shrink-0" />{option.live.free} of {option.live.reporting} bays free now</p>}
        </section>

        <div className="mt-4 flex gap-2.5">
          <a href={directionsUrl(option.lat, option.lng)} target="_blank" rel="noreferrer" onClick={() => trackEvent('directions_open', { result_type: option.kind })}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#1769ff] text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,105,255,.3)] transition-transform active:scale-[0.98]">
            <Navigation className="h-4 w-4" />Go
          </a>
          {option.fits !== false && !later && (
            <button
              disabled={reminder === 'starting'}
              onClick={async () => {
                setReminder('starting')
                const result = await startParking({
                  name: option.kind === 'street' ? shortStreetName(option.name) : option.name,
                  lat: option.lat, lng: option.lng, kind: option.kind,
                  startedAt: arrival.toISOString(), leaveBy: leaveBy.toISOString(),
                  limitAt: limitAt?.toISOString(), cents: option.cents,
                })
                setReminder(result)
              }}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#eef4ff] text-sm font-bold text-[#1769ff] transition-transform active:scale-[0.98] disabled:opacity-60">
              <BellRing className="h-4 w-4" />{reminder && reminder !== 'starting' ? 'Reminder set' : 'Remind me'}
            </button>
          )}
        </div>
        {!reminder && option.fits !== false && !later && <p className="mt-2 text-xs text-[#64748b]">Parked? Tap Remind me and we'll warn you {REMIND_BEFORE_MINUTES} min before {clock(leaveBy)}.</p>}
        {reminder === 'scheduled' && <p role="status" className="mt-2 text-xs text-[#065f46]">We'll remind you {REMIND_BEFORE_MINUTES} min before, and when time is up.</p>}
        {reminder === 'in-app-only' && <p role="status" className="mt-2 text-xs text-[#64748b]">Reminder set. In a browser it only shows while Bay is open.</p>}
        {reminder === 'denied' && <p role="status" className="mt-2 text-xs text-[#b45309]">Notifications are off for Bay, so keep an eye on the countdown on the home screen.</p>}
        {option.notes && <p className="mt-3 text-sm text-[#40516d]">{option.notes}</p>}

        <details className="group mt-4 border-t border-[#eef2f7] pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#40516d] [&::-webkit-details-marker]:hidden">
            Price details<ChevronDown className="h-4 w-4 group-open:rotate-180" />
          </summary>
          {option.segments && option.segments.length > 0 && (
            <ul className="divide-y divide-[#eef2f7] text-sm">
              {option.segments.map(seg => (
                <li key={seg.fromMinute} className="flex justify-between py-2 tabular-nums">
                  <span>{clock(new Date(arrival.getTime() + seg.fromMinute * 60_000))}–{clock(new Date(arrival.getTime() + seg.toMinute * 60_000))}</span>
                  <span className="font-semibold">{formatCents(seg.centsPerHour)}/hr</span>
                </li>
              ))}
              {option.cents != null && <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCents(option.cents)}</span></li>}
            </ul>
          )}
          <p className="mt-2 text-xs leading-5 text-[#64748b] [text-wrap:pretty]">
            {option.kind === 'carpark' ? 'Drive-up rate' : 'Council rate'} from {option.source.url ? <a href={option.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[#40516d] underline">{option.source.label}<ExternalLink className="h-3 w-3" /></a> : option.source.label}
            {option.source.date && <>, checked {dateLabel(option.source.date)}</>}{option.source.stale && <strong className="text-[#b45309]"> (may be out of date)</strong>}.
            {' '}{option.live && 'Free bays come from council sensors and update every few minutes. '}Rates can change. The sign at the bay or the car park entrance is what applies.
          </p>
        </details>
        <ReportProblem placeId={option.id} placeName={option.name} />
      </div>
    </div>
  )
}

const PROBLEMS = ['Price is wrong', 'Time limit is wrong', "Can't park here", 'Something else'] as const

/** Lets a driver flag a wrong price or sign in two taps. */
function ReportProblem({ placeId, placeName }: { placeId: string; placeName: string }) {
  const [open, setOpen] = useState(false)
  const [problem, setProblem] = useState<(typeof PROBLEMS)[number] | null>(null)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  if (state === 'sent') return <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#047857]"><Check className="h-4 w-4" />Thanks, we'll check it.</p>
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-[#40516d]"><Flag className="h-4 w-4" />Something wrong here?</button>
  return <form className="mt-3 rounded-2xl bg-[#f8fafc] p-3" onSubmit={async e => {
    e.preventDefault(); if (!problem) return
    setState('sending')
    try { await reportPlaceProblem(placeId, placeName, problem, note); setState('sent') } catch { setState('error') }
  }}>
    <p className="text-sm font-semibold text-[#0b1730]">What's wrong?</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {PROBLEMS.map(p => <button type="button" key={p} aria-pressed={problem === p} onClick={() => setProblem(p)}
        className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${problem === p ? 'bg-[#1769ff] text-white' : 'bg-white text-[#40516d] shadow-[inset_0_0_0_1px_#dce7f8]'}`}>{p}</button>)}
    </div>
    <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2} placeholder="What does the sign say? (optional)" aria-label="Details (optional)"
      className="mt-2 w-full rounded-xl bg-white p-2.5 text-sm text-[#0b1730] shadow-[inset_0_0_0_1px_#dce7f8] outline-none focus:shadow-[inset_0_0_0_2px_#1769ff]" />
    {state === 'error' && <p className="mt-1 text-xs text-[#b45309]">Couldn't send. Check your connection and try again.</p>}
    <div className="mt-2 flex gap-2">
      <button type="submit" disabled={!problem || state === 'sending'} className="h-11 flex-1 rounded-[14px] bg-[#1769ff] text-sm font-bold text-white disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Send'}</button>
      <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-[14px] px-4 text-sm font-semibold text-[#40516d]">Cancel</button>
    </div>
  </form>
}

/** Native share sheet where available, otherwise copy to clipboard. */
async function sharePlace(option: ParkingOption, price: string, durationMinutes: number, leaveBy: Date): Promise<boolean> {
  const title = option.kind === 'street' ? splitStreet(option.name).title : option.name
  const text = `Parking at ${title}: ${price} for ${formatDurationShort(durationMinutes)}, leave by ${clock(leaveBy)}. Found on Bay.`
  const url = `https://www.google.com/maps/search/?api=1&query=${option.lat},${option.lng}`
  try {
    if (navigator.share) { await navigator.share({ title: `Parking at ${title}`, text, url }); return false }
    await navigator.clipboard.writeText(`${text} ${url}`); return true
  } catch { return false }
}

