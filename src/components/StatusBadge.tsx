import type { SpotStatus } from '../types'
import { getStatusColors } from '../lib/statusColors'
import { formatChangesAt } from '../lib/parkingStatus'

export function StatusBadge({ status }: { status: SpotStatus }) {
  const colors = getStatusColors(status)
  const changes = formatChangesAt(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {status.label}
      {changes && <span className="opacity-70">· {changes}</span>}
    </span>
  )
}
