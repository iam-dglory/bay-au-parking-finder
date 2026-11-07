import type { ParkingSpot } from '../types'

export const SENSOR_MAX_AGE_MINUTES = 5
export const REPORT_MAX_AGE_MINUTES = 10
/** A sensor that keeps reporting but has not changed state for this long is
 * treated as stuck. On 6 Nov 2026, 2,256 of 5,794 Melbourne sensors (39%)
 * had not changed in 30+ days while still reporting, which a busy city bay
 * cannot do. 24 h keeps genuinely long-parked bays from being wrongly trusted. */
export const SENSOR_STUCK_AFTER_HOURS = 24
export type Availability = { state: 'vacant' | 'occupied' | 'uncertain' | 'unknown'; label: string; color: string }
const ON_ARRIVAL: Availability = { state: 'unknown', label: 'Availability on arrival', color: '#64748b' }
function fresh(iso: string | undefined, now: Date, limit: number) {
  const minutes = iso ? (now.getTime() - Date.parse(iso)) / 60000 : NaN
  return Number.isFinite(minutes) && minutes >= 0 && minutes <= limit
}
/** Vacancy requires a fresh, exact council ID match. A tap by a driver is a
 * short-lived observation, not a live feed; it never overrides the sensor. */
export function availability(spot: Pick<ParkingSpot, 'sensor_status' | 'latest_ping' | 'kerbside_id'>, now = new Date()): Availability {
  const sensor = spot.sensor_status
  const exactId = Boolean(spot.kerbside_id && sensor?.match_method === 'kerbside_id' && (
    sensor.sensor_kerbside_id != null ? String(sensor.sensor_kerbside_id) === spot.kerbside_id : sensor.match_method === 'kerbside_id'
  ))
  if (!sensor || !exactId || !['present', 'unoccupied'].includes(sensor.status) ||
    !fresh(sensor.last_confirmed_at, now, SENSOR_MAX_AGE_MINUTES) ||
    !fresh(sensor.synced_at, now, SENSOR_MAX_AGE_MINUTES) ||
    !fresh(sensor.status_timestamp, now, SENSOR_STUCK_AFTER_HOURS * 60)) return ON_ARRIVAL
  const state = sensor.status === 'present' ? 'occupied' : 'vacant'
  return { state, label: state === 'occupied' ? 'Occupied now' : 'Vacant now', color: state === 'occupied' ? '#e11d48' : '#059669' }
}
