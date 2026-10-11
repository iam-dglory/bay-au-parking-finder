import type { ReactNode } from 'react'
import { BadgeDollarSign, CarFront, Check, Clock3, Filter, Tag, X } from 'lucide-react'
import type { SignType } from '../types'
import { SIGN_TYPE_LABELS } from '../types'

const RADIUS_OPTIONS = [{ label: '500 m', value: 500 }, { label: '1 km', value: 1000 }, { label: '2 km', value: 2000 }, { label: '5 km', value: 5000 }]
const CATEGORY_OPTIONS: { label: string; value: SignType | 'all' }[] = [
  { label: 'All zones', value: 'all' }, { label: SIGN_TYPE_LABELS.PAID_METER, value: 'PAID_METER' },
  { label: SIGN_TYPE_LABELS.TIME_LIMITED, value: 'TIME_LIMITED' }, { label: SIGN_TYPE_LABELS.PERMIT_ONLY, value: 'PERMIT_ONLY' },
  { label: SIGN_TYPE_LABELS.LOADING_ZONE, value: 'LOADING_ZONE' }, { label: SIGN_TYPE_LABELS.ACCESSIBLE_PERMIT, value: 'ACCESSIBLE_PERMIT' },
]

export function FilterBar({ vacantOnly, onVacantOnlyChange, radiusM, onRadiusChange, freeOnly, onFreeOnlyChange, category, onCategoryChange, showCarParks, onShowCarParksChange, mappedOnly = false, onClose }: {
  vacantOnly: boolean; onVacantOnlyChange: (v: boolean) => void; radiusM: number; onRadiusChange: (v: number) => void
  freeOnly: boolean; onFreeOnlyChange: (v: boolean) => void; category: SignType | 'all'; onCategoryChange: (v: SignType | 'all') => void
  showCarParks: boolean; onShowCarParksChange: (v: boolean) => void; mappedOnly?: boolean; onClose?: () => void
}) {
  const reset = () => { onRadiusChange(1000); onVacantOnlyChange(false); onFreeOnlyChange(false); onCategoryChange('all'); onShowCarParksChange(true) }
  return <section aria-label="Parking filters" className="max-h-[82dvh] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-6 pt-3 sm:rounded-[28px]">
    <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
    <div className="mt-3 flex items-center justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]">Refine the map</p><h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#0b1730]">Filters</h2></div>
      <button onClick={onClose} className="bay-icon-button h-10 w-10" aria-label="Close filters"><X className="h-5 w-5" /></button>
    </div>
    <div className="mt-5"><p className="text-sm font-semibold text-[#0b1730]">Search radius</p><div className="mt-2 grid grid-cols-4 gap-2">{RADIUS_OPTIONS.map(o => <button key={o.value} onClick={() => onRadiusChange(o.value)} className={`rounded-xl border px-2 py-2.5 text-xs font-bold ${radiusM === o.value ? 'border-[#1769ff] bg-[#1769ff] text-white shadow-lg shadow-blue-500/20' : 'border-[#e3eaf3] text-[#64748b]'}`}>{o.label}</button>)}</div></div>
    {!mappedOnly && <>
      <div className="mt-6"><p className="text-sm font-semibold text-[#0b1730]">Parking type</p><div className="mt-2 grid grid-cols-3 gap-2">
        <ToggleTile icon={<Filter className="h-4 w-4" />} label="All zones" active={category === 'all'} onClick={() => onCategoryChange('all')} />
        <ToggleTile icon={<Clock3 className="h-4 w-4" />} label="Time limits" active={category === 'TIME_LIMITED'} onClick={() => onCategoryChange('TIME_LIMITED')} />
        <ToggleTile icon={<Tag className="h-4 w-4" />} label="Paid" active={category === 'PAID_METER'} onClick={() => onCategoryChange('PAID_METER')} />
      </div></div>
      <details className="mt-3 rounded-2xl border border-[#e3eaf3] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#40516d]">More sign types</summary><div className="mt-3 flex flex-wrap gap-2">{CATEGORY_OPTIONS.slice(3).map(o => <button key={o.value} onClick={() => onCategoryChange(o.value)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${category === o.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>{o.label}</button>)}</div></details>
      <div className="mt-5 space-y-3">
        <Switch label="Show only fresh vacant readings" detail="Only where a current source publishes a bay reading." on={vacantOnly} onChange={onVacantOnlyChange} />
        <Switch label="Show no-fee parking" detail="Uses mapped parking terms where available." on={freeOnly} onChange={onFreeOnlyChange} />
      </div>
    </>}
    <div className="mt-5"><Switch icon={<CarFront className="h-4 w-4" />} label="Parking areas" detail="Lots, garages and other off-street facilities." on={showCarParks} onChange={onShowCarParksChange} /></div>
    <div className="mt-6 flex gap-3"><button onClick={reset} className="flex-1 rounded-2xl border border-[#e3eaf3] py-3.5 text-sm font-bold text-[#40516d]">Reset</button><button onClick={onClose} className="flex-1 rounded-2xl bg-[#1769ff] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25">Apply filters</button></div>
  </section>
}

function ToggleTile({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
 return <button onClick={onClick} className={`flex min-h-18 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-xs font-bold ${active ? 'border-[#1769ff] bg-blue-50 text-[#1769ff]' : 'border-[#e3eaf3] text-[#64748b]'}`}>{icon}{label}</button>
}
function Switch({ icon, label, detail, on, onChange }: { icon?: ReactNode; label: string; detail: string; on: boolean; onChange: (v: boolean) => void }) {
 return <button onClick={() => onChange(!on)} aria-pressed={on} className="relative flex w-full items-center gap-3 rounded-2xl border border-[#e3eaf3] p-3 text-left"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-blue-50 text-[#1769ff]' : 'bg-slate-50 text-slate-400'}`}>{icon ?? <BadgeDollarSign className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#0b1730]">{label}</span><span className="mt-0.5 block text-xs leading-4 text-[#64748b]">{detail}</span></span><span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${on ? 'bg-[#1769ff] justify-end' : 'bg-slate-200 justify-start'}`}>{on && <Check className="absolute ml-1 h-3 w-3 text-blue-600" />}<span className="h-5 w-5 rounded-full bg-white shadow-sm" /></span></button>
}
