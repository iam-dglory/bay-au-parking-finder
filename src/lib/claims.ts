import { supabase } from './supabaseClient'

export const CLAIM_DURATION_MINUTES = 20

export interface SpotClaim {
  expires_at: string
}

export interface ClaimInfo {
  active: boolean
  minutesLeft: number
}

/** A claim is a short, unpaid hold — "I'm heading there now" — not a real
 * reservation (nothing stops a stranger from parking there anyway), so it's
 * purely informational once expired rather than something to trust. */
export function getClaimInfo(latestClaim: SpotClaim | null, now: Date = new Date()): ClaimInfo {
  if (!latestClaim) return { active: false, minutesLeft: 0 }
  const minutesLeft = Math.ceil((new Date(latestClaim.expires_at).getTime() - now.getTime()) / 60_000)
  if (minutesLeft <= 0) return { active: false, minutesLeft: 0 }
  return { active: true, minutesLeft }
}

/** Fire-and-forget-friendly: places a CLAIM_DURATION_MINUTES hold on a spot. */
export async function submitClaim(spotId: string) {
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return { error: new Error('Not signed in') }
  const expiresAt = new Date(Date.now() + CLAIM_DURATION_MINUTES * 60_000).toISOString()
  return supabase.from('spot_claims').insert({ spot_id: spotId, user_id: userId, expires_at: expiresAt })
}
