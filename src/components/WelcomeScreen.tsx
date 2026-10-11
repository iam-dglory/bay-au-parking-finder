import { WORDMARK_URL } from '../lib/assets'

/** A brief brand reveal that runs while the initial location preference loads. */
export function WelcomeScreen() {
  return (
    <main className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#071227] px-6 text-center text-white" aria-label="Opening Bay">
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-[-4rem] h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <section className="relative z-10 flex max-w-sm flex-col items-center">
        <div className="bay-logo-reveal rounded-[2rem] bg-white px-7 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <img src={WORDMARK_URL} alt="Bay" className="h-auto w-56 max-w-full" />
        </div>
        <p className="bay-copy-reveal mt-8 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Nearest parking, with clearer evidence.</p>
        <p className="bay-copy-reveal mt-3 max-w-xs text-sm leading-6 text-slate-300" style={{ animationDelay: '180ms' }}>
          Bay brings nearby parking areas, restrictions and published prices into one map.
        </p>
        <div className="bay-progress mt-9 h-1 w-36 overflow-hidden rounded-full bg-white/15" aria-hidden="true"><span /></div>
      </section>
    </main>
  )
}
