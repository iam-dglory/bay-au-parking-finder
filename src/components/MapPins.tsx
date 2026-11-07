import type { ParkingOption } from '../lib/parkingOptions'
import { signNotation } from './Kerb'
import { formatCents } from '../lib/parkingCost'

export type Point = { lat: number; lng: number }

/** Map tags read like small sign plates: white with navy for streets, navy for
 * car parks, lime for the one you've picked. */
export function PricePin({ option, selected }: { option: ParkingOption; selected: boolean }) {
  const blocked = option.fits === false
  const label = blocked ? (signNotation(option.limitMinutes) ?? 'Short')
    : option.cents === 0 ? 'Free'
    : option.cents != null ? formatCents(option.cents)
    : option.range ? `${formatCents(option.range.min)}+`
    : '?'
  const tone = selected ? 'bg-[#dbff00] text-[#102c40] shadow-[0_0_0_2px_#102c40,0_6px_16px_rgba(16,44,64,.35)] scale-110'
    : blocked ? 'bg-white text-[#8fa4b5] shadow-[0_0_0_1.5px_rgba(16,44,64,.2)]'
    : option.kind === 'carpark' ? 'bg-[#102c40] text-white shadow-[0_0_0_1.5px_rgba(255,255,255,.7),0_4px_12px_rgba(16,44,64,.3)]'
    : 'bg-white text-[#102c40] shadow-[0_0_0_1.5px_rgba(16,44,64,.35),0_4px_12px_rgba(16,44,64,.2)]'
  return (
    <span className={`figure flex items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[13px] transition-transform ${tone}`}>
      {option.kind === 'carpark' && <span className="text-[11px] font-black">P</span>}
      {label}
      {option.live && option.live.free > 0 && <span className="ml-0.5 h-2 w-2 rounded-full bg-[#dbff00] shadow-[0_0_0_1.5px_#102c40]" aria-label={`${option.live.free} free now`} />}
    </span>
  )
}

/** "You are here": navy dot with a lime halo. */
export function MeDot() {
  return <span className="block h-4 w-4 rounded-full border-[3px] border-white bg-[#102c40] shadow-[0_0_0_6px_rgba(219,255,0,.45)]" />
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
