import { MapPin, Navigation, ParkingCircle, Sparkles } from 'lucide-react'
import { BrandMark } from './BrandMark'

type WelcomePhase = 'connecting' | 'locating' | 'ready'

const COPY: Record<WelcomePhase, { title: string; detail: string }> = {
  connecting: { title: 'Preparing your parking map', detail: 'Connecting to Bay’s live map and parking data.' },
  locating: { title: 'Finding what is nearby', detail: 'Using your saved place or current location.' },
  ready: { title: 'Parking, with context', detail: 'Restrictions, published prices and availability where it is provided.' },
}

export function WelcomeScreen({ phase, onChooseLocation }: { phase: WelcomePhase; onChooseLocation: () => void }) {
  const copy = COPY[phase]
  return (
    <main className="relative flex h-full min-h-[100dvh] overflow-hidden bg-[#f7f9fc] px-6 text-[#0b1730]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(circle_at_50%_0%,rgba(23,105,255,.14),transparent_62%)]" />
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center justify-center pb-10 text-center">
        <div className="mb-9 rounded-[30px] border border-white/80 bg-white px-7 py-5 shadow-[0_22px_60px_rgba(23,105,255,.14)]">
          <BrandMark className="w-44" />
        </div>
        <div className="relative mb-9 h-44 w-full overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-[#e8f1ff] via-white to-[#e1fbf5] shadow-[0_18px_45px_rgba(15,23,42,.08)]">
          <div className="absolute -left-7 top-20 h-24 w-60 -rotate-12 rounded-[50%] border-[16px] border-blue-200/60" />
          <div className="absolute -right-10 bottom-1 h-28 w-64 rotate-12 rounded-[50%] border-[15px] border-blue-100" />
          <div className="absolute left-[23%] top-9 rounded-2xl bg-white p-2.5 shadow-lg"><ParkingCircle className="h-6 w-6 text-[#1769ff]" /></div>
          <div className="absolute right-[22%] bottom-7 rounded-2xl bg-[#1769ff] p-3 shadow-[0_12px_28px_rgba(23,105,255,.35)]"><MapPin className="h-7 w-7 text-white" fill="currentColor" /></div>
          <div className="absolute bottom-4 left-[45%] rounded-xl bg-emerald-500 p-1.5"><Navigation className="h-4 w-4 text-white" /></div>
        </div>
        <div className="min-h-24">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#1769ff]"><Sparkles className="h-3.5 w-3.5" /> Bay is loading</p>
          <h1 className="text-2xl font-bold tracking-[-.04em]">{copy.title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#64748b]">{copy.detail}</p>
        </div>
        <div className="mt-5 h-1.5 w-44 overflow-hidden rounded-full bg-[#dce6f5]" aria-label="Loading">
          <div className="h-full w-2/3 rounded-full bg-[#1769ff] transition-all" />
        </div>
        {phase === 'locating' && <button onClick={onChooseLocation} className="mt-7 text-sm font-semibold text-[#1769ff] underline underline-offset-4">Choose a place instead</button>}
      </div>
    </main>
  )
}
