import { SignMark } from './BrandMark'

type WelcomePhase = 'connecting' | 'locating' | 'ready'

const DETAIL: Record<WelcomePhase, string> = {
  connecting: 'Loading Melbourne parking…',
  locating: 'Finding parking near you…',
  ready: 'Ready',
}

export function WelcomeScreen({ phase, onChooseLocation }: { phase: WelcomePhase; onChooseLocation: () => void }) {
  return (
    <main className="relative flex h-full min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center text-[#0b1730]">
      <SignMark className="h-24 w-24 drop-shadow-[0_14px_30px_rgba(23,105,255,.35)]" title="Bay" />
      <h1 className="mt-6 text-4xl font-extrabold tracking-[-.04em]">Bay</h1>
      <p className="mt-1 text-base text-[#40516d]">What parking costs in Melbourne, before you get there.</p>
      <p role="status" className="mt-10 text-sm text-[#64748b]">{DETAIL[phase]}</p>
      <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-[#e6eefb]" aria-hidden>
        <div className="h-full w-1/3 animate-[bay-load_1.2s_ease-in-out_infinite] rounded-full bg-[#1769ff]" />
      </div>
      {phase === 'locating' && <button onClick={onChooseLocation} className="mt-8 min-h-11 rounded-full px-4 text-sm font-semibold text-[#1769ff] hover:bg-[#f5f8ff]">Start in Melbourne CBD</button>}
    </main>
  )
}
