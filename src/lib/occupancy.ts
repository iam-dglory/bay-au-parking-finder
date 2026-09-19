import { supabase } from './supabaseClient'
import type { SpotStatusPing } from '../types'

export const OCCUPANCY_FRESHNESS_MINUTES = 30

export interface OccupancyInfo {
  status: 'occupied' | 'free' | 'unknown'
  ageMinutes: number | null
}

/** A ping older than the freshness window tells us nothing reliable anymore —
 * a car that was there 2 hours ago may well have left. Returns 'unknown'
 * rather than pretending stale data is still true. */
export function getOccupancyInfo(
  latestPing: SpotStatusPing | null,
  now: Date = new Date(),
  freshnessMinutes: number = OCCUPANCY_FRESHNESS_MINUTES,
): OccupancyInfo {
  if (!latestPing) return { status: 'unknown', ageMinutes: null }
  const ageMinutes = (now.getTime() - new Date(latestPing.created_at).getTime()) / 60_000
  if (ageMinutes < 0 || ageMinutes > freshnessMinutes) return { status: 'unknown', ageMinutes: null }
  return { status: latestPing.status, ageMinutes: Math.round(ageMinutes) }
}

export function formatOccupancyAge(ageMinutes: number): string {
  if (ageMinutes < 1) return 'just now'
  if (ageMinutes === 1) return '1 min ago'
  return `${ageMinutes} min ago`
}

/** Fire-and-forget: records a crowdsourced "occupied"/"free" report for a spot. */
export function submitOccupancyPing(spotId: string, status: 'occupied' | 'free') {
  return supabase.auth.getUser().then(({ data }) => {
    const userId = data.user?.id
    if (!userId) return
    return supabase.from('spot_status_pings').insert({ spot_id: spotId, user_id: userId, status })
  })
}
