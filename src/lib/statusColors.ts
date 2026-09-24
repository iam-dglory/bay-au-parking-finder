import type { SpotStatus, UsabilityStatus } from '../types'

export const STATUS_COLORS: Record<UsabilityStatus, { bg: string; text: string; dot: string; hex: string }> = {
  unknown: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', hex: '#64748b' },
  free: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', hex: '#10b981' },
  paid: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', hex: '#f59e0b' },
  restricted: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500', hex: '#f43f5e' },
}

/** International accessible-parking signage is conventionally blue, and it's a
 * meaningfully different kind of "restricted" (permit-specific, not "no parking
 * at all") — worth its own colour rather than blending into the same red as a
 * clearway or loading zone. */
export const ACCESSIBLE_COLORS = { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', hex: '#3b82f6' }

export function getStatusColors(status: SpotStatus) {
  if (status.status === 'restricted' && status.ruleApplied?.sign_type === 'ACCESSIBLE_PERMIT') {
    return ACCESSIBLE_COLORS
  }
  return STATUS_COLORS[status.status]
}
