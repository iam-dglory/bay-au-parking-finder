import { supabase } from './supabaseClient'

/** Fire-and-forget: logs that the user asked for directions to a spot, which
 * is the only honest signal we have that they actually went to park there
 * (no GPS check-in). Never blocks navigation on failure. */
export function logVisit(refId: string, addressText: string, country: string | null) {
  supabase.auth.getUser().then(({ data }) => {
    const userId = data.user?.id
    if (!userId) return
    supabase.from('spot_visits').insert({ user_id: userId, kind: 'free_sign', ref_id: refId, address_text: addressText, country }).then()
  })
}
