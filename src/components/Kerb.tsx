import type { ParkingOption } from '../lib/parkingOptions'

/** Sign notation for a time limit: 30 → "½P", 120 → "2P". Null when the limit
 * isn't one a sign would show (e.g. free hours before a 2P starts). */
export function signNotation(minutes: number | null): string | null {
  if (minutes == null) return 'P'
  if (minutes === 15) return '¼P'
  if (minutes === 30) return '½P'
  if (minutes % 60 === 0 && minutes <= 240) return `${minutes / 60}P`
  return null
}

/** What the kerb would tell you: a small sign plate with the rule on it. */
export function SignPlate({ option, size = 'md' }: { option: ParkingOption; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-[60px] w-[52px]' : 'h-12 w-[42px]'
  const big = size === 'lg' ? 'text-[24px]' : 'text-[19px]'
  if (option.kind === 'carpark') {
    return <span className={`plate plate-carpark ${box} shrink-0`} aria-hidden><span className={`${big} font-black`}>P</span><span className="plate-sub">Car park</span></span>
  }
  const unknown = option.cents == null && !option.range
  const rule = signNotation(option.limitMinutes) ?? 'P'
  const sub = unknown ? 'Check' : option.cents === 0 ? 'Free' : 'Meter'
  return <span className={`plate ${unknown ? 'plate-unknown' : ''} ${box} shrink-0`} aria-hidden>
    <span className={`${big} font-black tracking-[-.04em]`}>{rule}</span><span className="plate-sub">{sub}</span>
  </span>
}

/** How the plate reads aloud, for screen readers. */
export function plateLabel(option: ParkingOption): string {
  if (option.kind === 'carpark') return 'Car park'
  const rule = signNotation(option.limitMinutes)
  const limit = option.limitMinutes == null ? 'no time limit' : rule && rule !== 'P' ? `${rule} limit` : ''
  const pay = option.cents == null && !option.range ? 'check the sign' : option.cents === 0 ? 'free' : 'meter'
  return ['Street parking', limit, pay].filter(Boolean).join(', ')
}

/** A time as a ticket printer would print it: mono digits, small am/pm. */
export function TicketTime({ date, className = '' }: { date: Date; className?: string }) {
  const [hm, ap] = date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' }).split(/\s/)
  return <span className={`ticket-type whitespace-nowrap ${className}`}>{hm}<span className="ml-1 font-sans text-[.55em] font-bold">{ap}</span></span>
}
