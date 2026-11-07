import { ExternalLink, ImageOff, MapPin, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CarPark } from '../types'
import { ParkingAreaDetails } from './ParkingAreaDetails'
import { ParkingInformationReportForm } from './ParkingInformationReportForm'
import { trackEvent } from '../lib/analytics'

export function ParkingAreaSheet({ area, onClose }: { area: CarPark | null; onClose: () => void }) {
  const [reportOpen, setReportOpen] = useState(false)
  const trackedAreaId = useRef<string | null>(null)
  useEffect(() => {
    if (!area) {
      trackedAreaId.current = null
      return
    }
    if (trackedAreaId.current === area.id) return
    trackedAreaId.current = area.id
    trackEvent('parking_result_view', { result_type: 'parking_area' })
  }, [area])
  if (!area) return null
  return <><div className="fixed inset-0 z-[1000] flex items-end justify-center bg-night/30 p-0 sm:items-center sm:p-5" onClick={onClose}>
    <section role="dialog" aria-label="Parking area details" className="bay-sheet max-h-[84dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-surface px-5 pb-7 pt-3 sm:rounded-[28px]" onClick={e => e.stopPropagation()}>
      <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-200" />
      <div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Parking area</p><h2 className="mt-1 text-xl font-bold tracking-tight text-ink">{area.address_text}</h2><p className="mt-1 flex items-center gap-1 text-sm text-ink-3"><MapPin className="h-4 w-4" />{Math.round(area.distance_m)} m away · availability on arrival</p></div><button onClick={onClose} className="bay-icon-button h-10 w-10 shrink-0" aria-label="Close parking area"><X className="h-5 w-5" /></button></div>
      <ParkingAreaPhoto area={area} />
      <div className="mt-5"><ParkingAreaDetails area={area} onReport={() => setReportOpen(true)} /></div>
      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-ink-3"><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />Entry, capacity and price details are source-provided. Check current signs and operator terms on arrival.</p>
    </section>
  </div>{reportOpen && <ParkingInformationReportForm locationKind="area" locationId={area.id} locationLabel={area.address_text} onClose={() => setReportOpen(false)} />}</>
}

function ParkingAreaPhoto({ area }: { area: CarPark }) {
  const [failed, setFailed] = useState(false)
  const url = area.photo_url?.startsWith('https://') ? area.photo_url : null
  if (!url || failed) return <div className="mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-line bg-tint px-3 py-3 text-xs text-ink-3"><ImageOff className="h-4 w-4 shrink-0 text-ink-3" />Photo not supplied by this parking source.</div>
  return <figure className="mt-5 overflow-hidden rounded-2xl border border-line bg-tint"><img src={url} alt={`Parking area: ${area.address_text}`} onError={() => setFailed(true)} className="h-44 w-full object-cover" />{area.photo_attribution && <figcaption className="px-3 py-2 text-[11px] text-ink-3">{area.photo_attribution}</figcaption>}</figure>
}
