import type { ParkingSpot } from '../types'

export const SENSOR_MAX_AGE_MINUTES = 20
export const REPORT_MAX_AGE_MINUTES = 10
export type Availability = { state: 'vacant' | 'occupied' | 'uncertain' | 'unknown'; label: string; color: string }
const UNKNOWN: Availability = { state: 'unknown', label: 'Occupancy unknown', color: '#64748b' }
function age(iso: string | undefined, now: Date) {
  return iso ? (now.getTime() - Date.parse(iso)) / 60000 : NaN
}
function fresh(iso: string | undefined, now: Date, limit: number) {
  const value = age(iso, now)
  return Number.isFinite(value) && value >= 0 && value <= limit
}
/** Keep legal permission, price and physical vacancy separate. A stale,
 * approximate or contradictory signal must never advertise a vacant bay. */
export function availability(spot: Pick<ParkingSpot, 'sensor_status' | 'latest_ping' | 'kerbside_id'>, now = new Date()): Availability {
  const sensor = spot.sensor_status
  const ping = spot.latest_ping
  const sensorMatchIsTrusted = sensor?.match_method === 'kerbside_id' || (sensor?.match_method == null && Boolean(spot.kerbside_id))
  const sensorUsable = Boolean(sensor && sensorMatchIsTrusted &&
    fresh(sensor.last_confirmed_at, now, SENSOR_MAX_AGE_MINUTES) &&
    (sensor.synced_at == null || fresh(sensor.synced_at, now, SENSOR_MAX_AGE_MINUTES)))
  const pingUsable = ping && fresh(ping.created_at, now, REPORT_MAX_AGE_MINUTES)
  const sensorState = sensor?.status === 'present' ? 'occupied' : 'vacant'
  const pingState = ping?.status === 'occupied' ? 'occupied' : 'vacant'
  if (pingUsable && sensorUsable && sensorState !== pingState) {
    return { state: 'uncertain', label: 'Conflicting reports - check bay', color: '#d97706' }
  }
  if (pingUsable && ping.corroborating_count < 2) {
    return { state: 'uncertain', label: `One person reports ${pingState}`, color: '#d97706' }
  }
  const state = pingUsable ? pingState : sensorUsable ? sensorState : null
  if (!state) return UNKNOWN
  return { state, label: `${pingUsable ? 'Community' : 'Sensor'} reports ${state}`, color: state === 'occupied' ? '#e11d48' : '#059669' }
}
