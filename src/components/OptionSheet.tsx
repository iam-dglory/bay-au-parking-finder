import { useState } from 'react'
import { BellRing, Check, ChevronDown, ExternalLink, Flag, Navigation, Radio, Share2, Star, TriangleAlert, Volume2, X } from 'lucide-react'
import { toggleFavourite, useFavourites } from '../lib/favourites'
import { SignPlate, TicketTime } from './Kerb'
import { NAV_APP_LABEL, setNavApp, useNavApp, type NavApp } from '../lib/navigation'
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
export function OptionSheet({ option, durationMinutes, arrival, later = false, onGo, onClose }: { option: ParkingOption | null; durationMinutes: number; arrival: Date; later?: boolean; onGo?: (option: ParkingOption) => void; onClose: () => void }) {
  const [reminder, setReminder] = useState<ReminderResult | 'starting' | null>(null)
  const [shared, setShared] = useState(false)
  const favourites = useFavourites()
  if (!option) return null
  const saved = favourites.some(f => f.id === option.id)
  const leaveAt = new Date(arrival.getTime() + durationMinutes * 60_000)
  const limitAt = option.limitMinutes != null ? new Date(arrival.getTime() + option.limitMinutes * 60_000) : null
  const leaveBy = limitAt && limitAt < leaveAt ? limitAt : leaveAt
  const { title, block } = option.kind === 'street' ? splitStreet(option.name) : { title: option.name, block: undefined }
  const kindLabel = option.kind === 'carpark' ? `${option.operator} car park` : `${option.bayCount} bay${option.bayCount === 1 ? '' : 's'} on this block`
  const price = option.cents === 0 ? 'Free' : option.cents != null ? formatCents(option.cents) : option.range ? `${formatCents(option.range.min)}–${formatCents(option.range.max)}` : 'Price not listed'
  return (
    <div className="bay-dim fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(6,12,28,.32)] sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={`${option.name} parking cost`} className="bay-sheet bay-sheet-in max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] glass glass-strong px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
        <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="mt-3 flex items-start gap-3">
          <SignPlate option={option} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-snug text-ink [text-wrap:balance]">{title}</h2>
            <p className="mt-1 text-sm text-ink-2">{kindLabel}, {walkMinutes(option.distanceM)} min walk</p>
            {block && <p className="text-xs text-ink-3">{block}</p>}
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[14px] text-ink-2 hover:bg-tint" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <section className="ticket mt-4 px-5 pt-5 text-ink">
          {option.fits === false ? <>
            <p className="text-2xl font-extrabold tracking-tight text-ink">Too short for {formatDurationShort(durationMinutes)}</p>
            {limitAt && <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-warn"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />Max stay here is {formatDurationShort(option.limitMinutes!)}. You'd have to leave by {clock(limitAt)}.</p>}
          </> : <>
            <p className="flex flex-wrap items-baseline gap-x-2"><span className="figure text-[46px] leading-none text-ink">{price}</span><span className="text-sm text-ink-2">for {formatDurationShort(durationMinutes)}{later ? `, arriving ${clock(arrival)}` : ''}</span></p>
            {option.kind === 'carpark' && option.rateName && option.rateName !== 'Hourly' && <p className="mt-1 text-sm text-ink-2">{option.rateName} rate</p>}

            {option.live && !later && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-ok"><Radio className="h-4 w-4 shrink-0" />{option.live.free} of {option.live.reporting} bays free now</p>}
            <span aria-hidden className="ticket-tear" />
            <div className="mt-5 flex h-[80px] items-center justify-between gap-3">
              <p className="min-w-0"><span className="block text-xs text-ink-3">Leave by</span><TicketTime className="block text-[28px] leading-8" date={leaveBy} /></p>
              {option.limitMinutes != null && <p className="text-right text-sm text-ink-2">{option.limitMinutes % 15 === 0 && option.limitMinutes <= 240 ? `Max stay ${formatDurationShort(option.limitMinutes)}` : `Free till then, stay till ${clock(limitAt!)}`}</p>}
            </div>
          </>}
        </section>

        <div className="mt-4 flex gap-2.5">
          <a href={directionsUrl(option.navTo?.lat ?? option.lat, option.navTo?.lng ?? option.lng)} target="_blank" rel="noreferrer" onClick={() => { if (onGo) onGo(option); else trackEvent('directions_open', { result_type: option.kind }) }}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full cta text-[17px] font-extrabold transition-transform active:scale-[0.98]">
            <Navigation className="h-5 w-5" />Go
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
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-tint-2 text-sm font-bold text-brand transition-transform active:scale-[0.98] disabled:opacity-60">
              <BellRing className="h-4 w-4" />{reminder && reminder !== 'starting' ? 'Reminder set' : 'Remind me'}
            </button>
          )}
        </div>
        <NavAppChoice />
          <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => toggleFavourite({ id: option.id, name: option.kind === 'street' ? shortStreetName(option.name) : option.name, lat: option.lat, lng: option.lng })} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save this place'}
            className={`flex h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-bold transition-colors ${saved ? 'bg-[color-mix(in_srgb,var(--pink)_14%,transparent)] text-pink' : 'bg-tint text-ink-2'}`}>
            <Star key={String(saved)} className={`h-5 w-5 ${saved ? 'bay-pop' : ''}`} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save'}
          </button>
          {canSpeak() ? <button onClick={() => speak(summary(option, price, durationMinutes, leaveBy, later ? arrival : null))} aria-label="Read out" className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-tint text-sm font-bold text-ink-2"><Volume2 className="h-5 w-5" />Read out</button> : <span />}
          <button onClick={async () => { if (await sharePlace(option, price, durationMinutes, leaveBy)) { setShared(true); window.setTimeout(() => setShared(false), 2000) } }} aria-label="Share" className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-tint text-sm font-bold text-ink-2">
            {shared ? <Check className="bay-pop h-5 w-5 text-ok" /> : <Share2 className="h-5 w-5" />}Share
          </button>
        </div>
        {!reminder && option.fits !== false && !later && <p className="mt-2 text-xs text-ink-3">Parked? Tap Remind me and we'll warn you {REMIND_BEFORE_MINUTES} min before {clock(leaveBy)}.</p>}
        {reminder === 'scheduled' && <p role="status" className="bay-rise mt-2 text-xs text-ok">We'll remind you {REMIND_BEFORE_MINUTES} min before, and when time is up.</p>}
        {reminder === 'in-app-only' && <p role="status" className="mt-2 text-xs text-ink-3">Reminder set. In a browser it only shows while Bay is open.</p>}
        {reminder === 'denied' && <p role="status" className="mt-2 text-xs text-warn">Notifications are off for Bay, so keep an eye on the countdown on the home screen.</p>}
        {option.notes && <p className="mt-3 text-sm text-ink-2">{option.notes}</p>}

        <details className="group mt-4 [&[open]>*:not(summary)]:[animation:bay-fade_.2s_ease-out_both] border-t border-line pt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-2 [&::-webkit-details-marker]:hidden">
            Price details<ChevronDown className="h-4 w-4 group-open:rotate-180" />
          </summary>
          {option.segments && option.segments.length > 0 && (
            <ul className="divide-y divide-line text-sm">
              {option.segments.map(seg => (
                <li key={seg.fromMinute} className="flex justify-between py-2 tabular-nums">
                  <span>{clock(new Date(arrival.getTime() + seg.fromMinute * 60_000))}–{clock(new Date(arrival.getTime() + seg.toMinute * 60_000))}</span>
                  <span className="font-semibold">{formatCents(seg.centsPerHour)}/hr</span>
                </li>
              ))}
              {option.cents != null && <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCents(option.cents)}</span></li>}
            </ul>
          )}
          <p className="mt-2 text-xs leading-5 text-ink-3 [text-wrap:pretty]">
            {option.kind === 'carpark' ? 'Drive-up rate' : 'Council rate'} from {option.source.url ? <a href={option.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-ink-2 underline">{option.source.label}<ExternalLink className="h-3 w-3" /></a> : option.source.label}
            {option.source.date && <>, checked {dateLabel(option.source.date)}</>}{option.source.stale && <strong className="text-warn"> (may be out of date)</strong>}.
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
  if (state === 'sent') return <p role="status" className="bay-rise mt-3 flex items-center gap-2 text-sm text-ok"><Check className="h-4 w-4" />Thanks, we'll check it.</p>
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-2"><Flag className="h-4 w-4" />Something wrong here?</button>
  return <form className="bay-rise mt-3 rounded-2xl bg-tint p-3" onSubmit={async e => {
    e.preventDefault(); if (!problem) return
    setState('sending')
    try { await reportPlaceProblem(placeId, placeName, problem, note); setState('sent') } catch { setState('error') }
  }}>
    <p className="text-sm font-semibold text-ink">What's wrong?</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {PROBLEMS.map(p => <button type="button" key={p} aria-pressed={problem === p} onClick={() => setProblem(p)}
        className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${problem === p ? 'cta text-white' : 'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]'}`}>{p}</button>)}
    </div>
    <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2} placeholder="What does the sign say? (optional)" aria-label="Details (optional)"
      className="mt-2 w-full rounded-xl bg-surface p-2.5 text-sm text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--brand)]" />
    {state === 'error' && <p className="mt-1 text-xs text-warn">Couldn't send. Check your connection and try again.</p>}
    <div className="mt-2 flex gap-2">
      <button type="submit" disabled={!problem || state === 'sending'} className="h-11 flex-1 rounded-[14px] cta text-sm font-bold text-white disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Send'}</button>
      <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-[14px] px-4 text-sm font-semibold text-ink-2">Cancel</button>
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

/** "Opens in Google Maps · Change" under the Go button. */
function NavAppChoice() {
  const app = useNavApp()
  const [open, setOpen] = useState(false)
  if (!open) return <button onClick={() => setOpen(true)} className="mt-1 min-h-10 text-xs text-ink-3">Opens in {NAV_APP_LABEL[app]}. <span className="font-semibold text-brand">Change</span></button>
  return <div className="bay-rise mt-2 flex gap-2" role="radiogroup" aria-label="Navigation app">
    {(Object.keys(NAV_APP_LABEL) as NavApp[]).map(a => <button key={a} role="radio" aria-checked={app === a} onClick={() => { setNavApp(a); setOpen(false) }}
      className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${app === a ? 'cta text-white' : 'bg-tint text-ink-2'}`}>{NAV_APP_LABEL[a]}</button>)}
  </div>
}

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Plain sentence for reading aloud before setting off. */
function summary(option: ParkingOption, price: string, durationMinutes: number, leaveBy: Date, arriving: Date | null) {
  const title = option.kind === 'street' ? splitStreet(option.name).title.replace(/\bSt\b/g, 'Street') : option.name
  if (option.fits === false) return `${title}. The time limit is too short for ${formatDurationShort(durationMinutes)}.`
  const cost = price === 'Free' ? 'Free' : price.startsWith('$') ? `${price.replace('–', ' to ')}` : price
  return [`${title}.`, `${cost} for ${formatDurationShort(durationMinutes).replace('hrs', 'hours').replace('hr', 'hour').replace('min', 'minutes')}${arriving ? `, arriving ${clock(arriving)}` : ''}.`, `Leave by ${clock(leaveBy)}.`, `${walkMinutes(option.distanceM)} minute walk.`].join(' ')
}

function speak(text: string) {
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-AU'; u.rate = 1
    window.speechSynthesis.speak(u)
  } catch { /* speech unavailable */ }
}

