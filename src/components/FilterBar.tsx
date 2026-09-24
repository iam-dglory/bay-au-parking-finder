import { BadgeDollarSign, CarFront, Clock3, Filter, HardHat, Accessibility, Tag } from 'lucide-react'
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
    <div className="border-b border-slate-200/80 bg-white px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onRadiusChange(opt.value)}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              radiusM === opt.value ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => onFreeOnlyChange(!freeOnly)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
            freeOnly ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/15' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <BadgeDollarSign className="h-4 w-4" strokeWidth={2} /> No fee
        </button>
        <button
          onClick={() => onShowCarParksChange(!showCarParks)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
            showCarParks ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
          }`}
        >
          <CarFront className="h-4 w-4" strokeWidth={2} /> Car parks
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><Filter className="h-3.5 w-3.5" /> Zone</span>
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              category === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span>{opt.value === 'PAID_METER' ? <Tag className="h-3.5 w-3.5" /> : opt.value === 'TIME_LIMITED' ? <Clock3 className="h-3.5 w-3.5" /> : opt.value === 'LOADING_ZONE' ? <HardHat className="h-3.5 w-3.5" /> : opt.value === 'ACCESSIBLE_PERMIT' ? <Accessibility className="h-3.5 w-3.5" /> : null}</span>{opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
