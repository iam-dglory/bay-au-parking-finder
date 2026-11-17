import { Capacitor } from '@capacitor/core'

const CHECK_EVERY_MS = 5 * 60_000
const RELOADED_FOR = 'bay.reloaded-for-build'

/** Web only: when a newer deploy is live, reload so phones (Safari tabs and
 * home-screen icons in particular) don't keep showing an old copy. Checks on
 * start and whenever the app comes back to the foreground, at most every 5
 * minutes. Reloads once per new build, so a stale cache can't cause a loop.
 * Native apps carry their own copy of the code and are updated by installing. */
export function startAutoUpdate(fetchImpl: typeof fetch = fetch): () => void {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined') return () => {}
  let lastCheck = 0
  const check = async () => {
    if (Date.now() - lastCheck < CHECK_EVERY_MS && lastCheck !== 0) return
    lastCheck = Date.now()
    try {
      const res = await fetchImpl(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const { build } = await res.json() as { build?: string }
      if (!build || build === __BAY_BUILD__) return
      if (sessionStorage.getItem(RELOADED_FOR) === build) return
      sessionStorage.setItem(RELOADED_FOR, build)
      window.location.reload()
    } catch {
      // Offline or storage blocked: try again next time the app is opened.
    }
  }
  const onVisible = () => { if (document.visibilityState === 'visible') void check() }
  void check()
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
