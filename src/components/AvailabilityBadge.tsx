import { availability } from '../lib/availability'
import type { ParkingSpot } from '../types'
export function AvailabilityBadge({ spot }: { spot: ParkingSpot }) {
  const result = availability(spot)
  return <span className="rounded-full border px-2 py-1 text-xs font-semibold" style={{ color: result.color, borderColor: result.color }}>{result.label}</span>
}
