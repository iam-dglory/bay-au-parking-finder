import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

/** A stay the driver started with "I've parked here". Kept on this device only. */
export interface ParkingSession {
  name: string
  lat: number
  lng: number
  kind: 'street' | 'carpark'
  startedAt: string
  /** When the driver planned to leave, capped at the time limit. */
  leaveBy: string
  /** The time limit, if the bay has one. */
  limitAt?: string
  cents?: number | null
}

const KEY = 'bay.parking-timer.v1'
/** Reminder lead time. Android delivers non-exact alarms a few minutes late in
 * battery saving, so 15 minutes leaves room to walk back. */
export const REMIND_BEFORE_MINUTES = 15
const NOTIFY_IDS = { soon: 7101, due: 7102 }

function storage(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

export function readSession(): ParkingSession | null {
  try {
    const raw = storage()?.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as ParkingSession
    // Forget sessions that ended more than 12 hours ago.
    return Date.parse(s.leaveBy) + 12 * 3_600_000 < Date.now() ? null : s
  } catch { return null }
}

const listeners = new Set<(s: ParkingSession | null) => void>()
function publish(s: ParkingSession | null) { for (const l of listeners) l(s) }

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })

export type ReminderResult = 'scheduled' | 'denied' | 'in-app-only'

export async function startParking(session: ParkingSession): Promise<ReminderResult> {
  try { storage()?.setItem(KEY, JSON.stringify(session)) } catch { /* storage unavailable: timer still runs this visit */ }
  publish(session)
  return scheduleReminders(session)
}

export async function endParking(): Promise<void> {
  try { storage()?.removeItem(KEY) } catch { /* ignore */ }
  publish(null)
  clearWebTimers()
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFY_IDS.soon }, { id: NOTIFY_IDS.due }] }).catch(() => {})
  }
}

async function scheduleReminders(s: ParkingSession): Promise<ReminderResult> {
  const due = Date.parse(s.leaveBy)
  const soon = due - REMIND_BEFORE_MINUTES * 60_000
  const now = Date.now()
  const messages = [
    { id: NOTIFY_IDS.soon, at: soon, title: `${REMIND_BEFORE_MINUTES} minutes left`, body: `Leave ${s.name} by ${clock(s.leaveBy)}.` },
    { id: NOTIFY_IDS.due, at: due, title: 'Time to move the car', body: `Your time at ${s.name} is up (${clock(s.leaveBy)}).` },
  ].filter(m => m.at > now + 30_000)

  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const permission = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' as const }))
    if (permission.display !== 'granted') return 'denied'
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFY_IDS.soon }, { id: NOTIFY_IDS.due }] }).catch(() => {})
    if (messages.length) await LocalNotifications.schedule({
      notifications: messages.map(m => ({ id: m.id, title: m.title, body: m.body, schedule: { at: new Date(m.at), allowWhileIdle: true }, isExactNotification: false })),
    })
    return 'scheduled'
  }

  // Web: notifications only fire while Bay is open in a tab.
  clearWebTimers()
  if (typeof Notification === 'undefined') return 'in-app-only'
  const permission = Notification.permission === 'default' ? await Notification.requestPermission().catch(() => 'denied' as const) : Notification.permission
  if (permission !== 'granted') return 'denied'
  for (const m of messages) webTimers.push(window.setTimeout(() => { try { new Notification(m.title, { body: m.body }) } catch { /* ignore */ } }, m.at - now))
  return 'in-app-only'
}

const webTimers: number[] = []
function clearWebTimers() { while (webTimers.length) window.clearTimeout(webTimers.pop()) }

/** Current session plus a ticking clock for the countdown. */
export function useParkingSession() {
  const [session, setSession] = useState<ParkingSession | null>(() => readSession())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    listeners.add(setSession)
    const tick = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => { listeners.delete(setSession); window.clearInterval(tick) }
  }, [])
  // Re-arm web reminders after a reload.
  useEffect(() => { if (session && !Capacitor.isNativePlatform()) void scheduleReminders(session) }, [session])
  const minutesLeft = session ? Math.round((Date.parse(session.leaveBy) - now) / 60_000) : null
  return { session, minutesLeft }
}
