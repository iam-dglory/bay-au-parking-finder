import type { UsabilityStatus } from '../types'

export const STATUS_COLORS: Record<UsabilityStatus, { bg: string; text: string; dot: string; hex: string }> = {
  free: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', hex: '#10b981' },
  paid: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', hex: '#f59e0b' },
  restricted: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500', hex: '#f43f5e' },
}
