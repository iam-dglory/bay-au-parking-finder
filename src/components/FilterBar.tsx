const RADIUS_OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
]

export function FilterBar({
  radiusM,
  onRadiusChange,
  freeOnly,
  onFreeOnlyChange,
}: {
  radiusM: number
  onRadiusChange: (v: number) => void
  freeOnly: boolean
  onFreeOnlyChange: (v: boolean) => void
}) {
  return (
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
    </div>
  )
}
