import { supabase } from './supabaseClient'
import type { SpotStatusPing, SensorStatus } from '../types'
import { SENSOR_MAX_AGE_MINUTES } from './availability'
import { haversineMeters } from './distance'

export const OCCUPANCY_FRESHNESS_MINUTES = 30

/** How many distinct people must agree before a report is shown as
 * "confirmed" rather than a soft "unconfirmed" note. A single anonymous tap
 * should never look as authoritative as multiple independent people agreeing. */
export const OCCUPANCY_CORROBORATION_THRESHOLD = 2

/** How close a reporter's live GPS position must be to a spot to report on it.
 * Stops someone spamming "occupied"/"free" on a spot they aren't actually at.
 * Generous enough to allow for ordinary urban GPS drift (usually 10-30m). */
export const OCCUPANCY_PROXIMITY_METERS = 200

export interface OccupancyInfo {
  status: 'occupied' | 'free' | 'unknown'
  ageMinutes: number | null
  corroboratingCount: number
  photoUrl: string | null
}

/** A ping older than the freshness window tells us nothing reliable anymore —
 * a car that was there 2 hours ago may well have left. Returns 'unknown'
 * rather than pretending stale data is still true. */
export function getOccupancyInfo(
  latestPing: SpotStatusPing | null,
  now: Date = new Date(),
  freshnessMinutes: number = OCCUPANCY_FRESHNESS_MINUTES,
): OccupancyInfo {
  if (!latestPing) return { status: 'unknown', ageMinutes: null, corroboratingCount: 0, photoUrl: null }
  const ageMinutes = (now.getTime() - new Date(latestPing.created_at).getTime()) / 60_000
  if (ageMinutes < 0 || ageMinutes > freshnessMinutes) return { status: 'unknown', ageMinutes: null, corroboratingCount: 0, photoUrl: null }
  return {
    status: latestPing.status,
    ageMinutes: Math.round(ageMinutes),
    corroboratingCount: latestPing.corroborating_count ?? 1,
    photoUrl: latestPing.photo_url,
  }
}

export interface SensorOccupancyInfo {
  status: 'occupied' | 'free'
  /** Minutes since the sensor's own heartbeat last confirmed this reading --
   * the headline freshness number to show. This is what "live" actually
   * means here: not how long the car has been parked, but how recently the
   * hardware last checked in. */
  confirmedAgoMinutes: number
  /** When the reading itself last changed. Often genuinely old (a bay that's
   * stayed free for weeks has no reason to "change"), so this is secondary,
   * informational detail -- never the headline, since a huge day-count reads
   * as broken even when it's accurate. */
  unchangedSince: string
  /** The sensor hasn't checked in recently, so this reading (whichever way
   * it points) can no longer be trusted as current -- it might be a dead
   * battery or a network dropout, not a real change on the ground. This is
   * judged from the sensor's own heartbeat, not from how long the reading
   * has held, since a genuinely long-parked car is a normal, valid reading
   * from a sensor that's working fine. */
  possiblyStuck: boolean
}

const SENSOR_HEARTBEAT_STALE_HOURS = SENSOR_MAX_AGE_MINUTES / 60

/** Historical sensor display helper. Live map state is decided exclusively
 * by availability(), including identity and source/download freshness. */
export function getSensorOccupancyInfo(sensorStatus: SensorStatus | null, now: Date = new Date()): SensorOccupancyInfo | null {
  if (!sensorStatus) return null
  const status = sensorStatus.status === 'present' ? 'occupied' : 'free'
  const heartbeatAgeMinutes = (now.getTime() - new Date(sensorStatus.last_confirmed_at).getTime()) / 60_000
  return {
    status,
    confirmedAgoMinutes: Math.max(0, Math.round(heartbeatAgeMinutes)),
    unchangedSince: sensorStatus.status_timestamp,
    possiblyStuck: !Number.isFinite(heartbeatAgeMinutes) || heartbeatAgeMinutes < 0 || heartbeatAgeMinutes / 60 > SENSOR_HEARTBEAT_STALE_HOURS,
  }
}

/** Formats a minute count the same way regardless of source (sensor heartbeat
 * or crowdsourced ping), so "confirmed 3 min ago" and "reported 3 min ago"
 * read consistently. */
export function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function formatOccupancyAge(ageMinutes: number): string {
  if (ageMinutes < 1) return 'just now'
  if (ageMinutes === 1) return '1 min ago'
  return `${ageMinutes} min ago`
}

/** Text describing how many people agree, so a viewer can judge confidence
 * instead of trusting a single anonymous tap blindly. */
export function formatCorroboration(count: number): string | null {
  if (count <= 1) return null
  return `${count} people agree`
}

export class TooFarAwayError extends Error {
  constructor() {
    super(`You need to be within ${OCCUPANCY_PROXIMITY_METERS}m of this spot to report on it.`)
  }
}

/** Records a crowdsourced "occupied"/"free" report for a spot, but only if the
 * reporter's current device location is actually near the spot. An optional
 * photo adds real evidence on top of that proximity check, for anyone who
 * wants to add it, but it's never required. The database itself also refuses
 * a second report from the same person on the same spot within 5 minutes. */
export async function submitOccupancyPing(
  spotId: string,
  status: 'occupied' | 'free',
  spotLocation: { lat: number; lng: number },
  reporterLocation: { lat: number; lng: number },
  photoUrl?: string,
) {
  if (haversineMeters(spotLocation, reporterLocation) > OCCUPANCY_PROXIMITY_METERS) {
    throw new TooFarAwayError()
  }
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return
  const { error } = await supabase.from('spot_status_pings').insert({ spot_id: spotId, user_id: userId, status, photo_url: photoUrl ?? null })
  if (error) throw new Error(error.message)
}
