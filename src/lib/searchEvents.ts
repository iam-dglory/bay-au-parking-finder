import { supabase } from './supabaseClient'

/** Fire-and-forget: logs a real "find parking near me" search that actually
 * returned results. The one honest signal for "are people actually using
 * Bay" -- distinct from survey opinions, which only capture who bothered to
 * respond. Never blocks the search UI on failure. */
export function logSearchEvent(center: { lat: number; lng: number }, radiusM: number, resultCount: number) {
  supabase.auth.getUser().then(({ data }) => {
    const userId = data.user?.id
    if (!userId) return
    supabase
      .from('search_events')
      .insert({ user_id: userId, lat: center.lat, lng: center.lng, radius_m: radiusM, result_count: resultCount })
      .then()
  })
}
