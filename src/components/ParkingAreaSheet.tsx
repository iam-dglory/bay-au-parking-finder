import { ExternalLink, MapPin, X } from 'lucide-react'
import type { CarPark } from '../types'
import { ParkingAreaDetails } from './ParkingAreaDetails'

export function ParkingAreaSheet({ area, onClose }: { area: CarPark | null; onClose: () => void }) {
  if (!area) return null
  return <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/30 p-0 sm:items-center sm:p-5" onClick={onClose}>
    <section role="dialog" aria-label="Parking area details" className="bay-sheet max-h-[84dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pb-7 pt-3 sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
      <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
      <div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]">Parking area</p><h2 className="mt-1 text-xl font-bold tracking-tight text-[#0b1730]">{area.address_text}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#64748b]"><MapPin className="h-4 w-4" />{Math.round(area.distance_m)} m away · availability on arrival</p></div><button onClick={onClose} className="bay-icon-button h-10 w-10 shrink-0" aria-label="Close parking area"><X className="h-5 w-5" /></button></div>
      <div className="mt-5"><ParkingAreaDetails area={area} /></div>
      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-[#64748b]"><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />Entry, capacity and price details are source-provided. Check current signs and operator terms on arrival.</p>
    </section>
  </div>
}
