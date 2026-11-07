import { CarFront, Navigation, ParkingSquare, X } from 'lucide-react'
import { NAV_APP_LABEL, navigationUrl, useNavApp } from '../lib/navigation'
import type { Heading } from '../lib/heading'
import { formatDurationShort } from '../lib/parkingCost'
import { trackEvent } from '../lib/analytics'

/** While the car is moving, Bay shows one thing: a big button that opens
 * navigation. Lists, menus and text stay hidden until the car stops (Victorian
 * road rules allow a mounted phone to be touched briefly for navigation only). */
export function DrivingOverlay({ target, onPassenger }: { target: { name: string; lat: number; lng: number } | null; onPassenger: () => void }) {
  const app = useNavApp()
  return <div role="dialog" aria-modal="true" aria-label="Driving" className="bay-fade fixed inset-0 z-[1500] flex flex-col bg-night px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white">
    <div className="flex items-center gap-3 text-white/70"><CarFront className="h-6 w-6" /><span className="text-lg font-semibold">Driving</span></div>
    <div className="flex flex-1 flex-col justify-center">
      {target ? <>
        <a href={navigationUrl(target.lat, target.lng, app)} target="_blank" rel="noreferrer" onClick={() => trackEvent('directions_open', { result_type: 'driving_mode' })}
          className="bay-press flex min-h-[132px] w-full flex-col items-center justify-center gap-2 rounded-[32px] cta px-6 text-center shadow-[0_18px_50px_rgba(16,44,64,.45)]">
          <Navigation className="h-10 w-10" />
          <span className="text-2xl font-extrabold leading-tight">Navigate to {target.name}</span>
        </a>
        <p className="mt-4 text-center text-base text-white/60">Opens {NAV_APP_LABEL[app]}</p>
      </> : <p className="text-center text-2xl font-bold leading-snug text-white/85">Bay will be here when you stop.</p>}
    </div>
    <button onClick={onPassenger} className="mx-auto min-h-12 rounded-full px-6 text-base font-semibold text-white/70">I'm a passenger</button>
  </div>
}

/** On arrival: one big tap to start the parking timer. */
export function ParkedPrompt({ heading, onStart, onDismiss }: { heading: Heading; onStart: () => void; onDismiss: () => void }) {
  const stay = heading.limitMinutes != null ? Math.min(heading.durationMinutes, heading.limitMinutes) : heading.durationMinutes
  return <div className="bay-rise mb-2 rounded-[22px] bg-night p-4 text-white">
    <div className="flex items-start gap-3">
      <ParkingSquare className="mt-0.5 h-6 w-6 shrink-0 text-lime" />
      <p className="min-w-0 flex-1 text-lg font-bold leading-snug">Parked at {heading.name}?</p>
      <button onClick={onDismiss} aria-label="Not now" className="-mr-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-white/60"><X className="h-5 w-5" /></button>
    </div>
    <button onClick={onStart} className="bay-press mt-3 h-14 w-full rounded-[18px] cta text-base font-extrabold">Start {formatDurationShort(stay).replace('hrs', 'hr')} timer</button>
  </div>
}
