import type { SignType } from '../types'
import { SIGN_TYPE_LABELS } from '../types'

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
]

/** The zone categories worth a quick tap -- the full label set (e.g.
 * "no stopping (clearway)") is available in the sign guide, but here we
 * keep it to the ones people actually go looking for on a map. */
const CATEGORY_OPTIONS: { label: string; value: SignType | 'all' }[] = [
  { label: 'All zones', value: 'all' },
  { label: SIGN_TYPE_LABELS.PAID_METER, value: 'PAID_METER' },
  { label: SIGN_TYPE_LABELS.TIME_LIMITED, value: 'TIME_LIMITED' },
  { label: SIGN_TYPE_LABELS.PERMIT_ONLY, value: 'PERMIT_ONLY' },
  { label: SIGN_TYPE_LABELS.LOADING_ZONE, value: 'LOADING_ZONE' },
  { label: SIGN_TYPE_LABELS.ACCESSIBLE_PERMIT, value: 'ACCESSIBLE_PERMIT' },
]

export function FilterBar({
  radiusM,
  onRadiusChange,
  freeOnly,
  onFreeOnlyChange,
  category,
  onCategoryChange,
  showCarParks,
  onShowCarParksChange,
}: {
  radiusM: number
  onRadiusChange: (v: number) => void
  freeOnly: boolean
  onFreeOnlyChange: (v: boolean) => void
  category: SignType | 'all'
  onCategoryChange: (v: SignType | 'all') => void
  /** Off-street car parks (multi-storey buildings/lots) -- opt-in since it's
   * a different kind of pin (capacity, not a legal-status colour) that could
   * clutter the map for someone just looking for a free on-street bay. */
  showCarParks: boolean
  onShowCarParksChange: (v: boolean) => void
}) {
  return (
    <div className="border-b border-slate-100">
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onRadiusChange(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              radiusM === opt.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => onFreeOnlyChange(!freeOnly)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            freeOnly ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Free only
        </button>
        <button
          onClick={() => onShowCarParksChange(!showCarParks)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            showCarParks ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Car parks
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2">
        <span className="shrink-0 text-xs font-medium text-slate-400">Zone:</span>
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              category === opt.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
