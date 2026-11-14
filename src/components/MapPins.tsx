import type { ParkingOption } from '../lib/parkingOptions'

export type Point = { lat: number; lng: number }

/**
 * Map markers answer one question only: can the driver rely on a live space?
 * Pricing belongs in the result card, where its source and conditions fit.
 */
export function PricePin({ option, selected }: { option: ParkingOption; selected: boolean }) {
  const open = option.live?.free != null && option.live.free > 0
  const full = option.live?.free === 0
  const label = open ? `${option.live!.free} open` : full ? 'Full' : 'P'
  const availabilityLabel = open
    ? `${option.live!.free} live parking spaces available`
    : full ? 'Confirmed full by the latest live reading' : 'Parking here; check availability on arrival'
  const tone = open
    ? 'bg-[#16A34A] text-white'
    : full ? 'bg-[#DC2626] text-white' : 'bg-[#1683F7] text-white'
  const shape = open || full ? 'min-w-11 rounded-full px-2.5 py-1 text-[11px]' : 'h-8 w-8 rounded-[10px] text-[15px]'
  const selectedTone = selected
    ? 'scale-110 shadow-[0_0_0_3px_#fff,0_0_0_5px_#0B1F40,0_7px_18px_rgba(11,31,64,.34)]'
    : 'shadow-[0_0_0_2px_#fff,0_5px_14px_rgba(11,31,64,.24)]'
  return (
    <span aria-label={availabilityLabel} className={`figure flex items-center justify-center whitespace-nowrap font-extrabold transition-transform ${shape} ${tone} ${selectedTone}`}>
      {label}
    </span>
  )
}

/** "You are here": BAY blue with a soft-blue halo. */
export function MeDot() {
  return <span className="block h-4 w-4 rounded-full border-[3px] border-white bg-[#1683F7] shadow-[0_0_0_6px_rgba(22,131,247,.24)]" />
}

/** Without a map: a quiet street grid, with the note up top so it never sits
 * under the floating buttons. */
export function MapUnavailable({ reason }: { reason: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-tint-2">
      <div aria-hidden className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--line)_2px,transparent_2px),linear-gradient(90deg,var(--line)_2px,transparent_2px)] [background-size:96px_64px,96px_64px]" />
      <p className="absolute inset-x-0 top-[38%] px-8 text-center text-xs text-ink-3"><span className="font-bold text-ink-2">Map unavailable.</span> {reason} Prices and the list still work.</p>
    </div>
  )
}
