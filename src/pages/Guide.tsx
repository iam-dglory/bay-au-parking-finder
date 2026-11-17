import { SIGN_OPTIONS } from '../lib/signPresets'
import { GUIDE_INTRO, SIGN_AVAILABILITY, SIGN_TYPE_MEANING } from '../lib/signGuide'
import type { SignType } from '../types'

/** A small kerb plate, so each row reads at a glance. */
function SignTile({ type }: { type: SignType }) {
  const restricted = SIGN_AVAILABILITY[type] === 'restricted'
  const face = type === 'FREE_UNLIMITED' ? <span className="text-[22px] font-black leading-none">P</span>
    : type === 'TIME_LIMITED' ? <span className="text-[18px] font-black leading-none">2P</span>
    : type === 'PAID_METER' ? <><span className="text-[18px] font-black leading-none">2P</span><span className="text-[7px] font-black tracking-[.08em]">METER</span></>
    : type === 'PERMIT_ONLY' ? <span className="text-[8px] font-black leading-tight">PERMIT<br />ONLY</span>
    : type === 'NO_STOPPING_CLEARWAY' ? <span className="text-[8px] font-black leading-tight">NO<br />STOP</span>
    : type === 'LOADING_ZONE' ? <span className="text-[8px] font-black leading-tight">LOADING<br />ZONE</span>
    : type === 'ACCESSIBLE_PERMIT' ? <span className="text-[20px] leading-none">♿</span>
    : <span className="text-[22px] font-black leading-none">P</span>
  return <span aria-hidden className={`flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md border-2 bg-white text-center ${restricted ? 'border-rose-500 text-rose-700' : 'border-brand text-brand'}`}>{face}</span>
}

function SignList({ title, tone, types }: { title: string; tone: 'ok' | 'no'; types: SignType[] }) {
  const signs = SIGN_OPTIONS.filter(s => types.includes(s.type))
  return <section aria-label={title} className="mt-5">
    <h2 className={`flex items-center gap-2 px-1 text-sm font-bold ${tone === 'ok' ? 'text-ok' : 'text-rose-700'}`}><i className={`h-2.5 w-2.5 rounded-full ${tone === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`} />{title}</h2>
    <ul className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
      {signs.map(sign => <li key={sign.type} className="flex items-center gap-3 px-3.5 py-3">
        <SignTile type={sign.type} />
        <span className="min-w-0"><span className="block font-bold leading-5 text-ink">{sign.label}</span><span className="block text-sm leading-5 text-ink-3">{SIGN_TYPE_MEANING[sign.type]}</span></span>
      </li>)}
    </ul>
  </section>
}

const CAN_PARK = SIGN_OPTIONS.map(s => s.type).filter(t => SIGN_AVAILABILITY[t] === 'usable')
const CANT_PARK = SIGN_OPTIONS.map(s => s.type).filter(t => SIGN_AVAILABILITY[t] === 'restricted')

export function Guide() {
  return <main className="h-full overflow-y-auto bg-tint pb-6 text-ink">
    <div className="mx-auto max-w-2xl px-4 pb-7 pt-[max(1.4rem,var(--safe-area-inset-top,env(safe-area-inset-top)))]">
      <h1 className="px-1 text-[26px] font-bold tracking-tight text-ink">Parking signs</h1>
      <p className="mt-1 px-1 text-[15px] leading-6 text-ink-2">{GUIDE_INTRO}</p>

      <SignList title="You can park" tone="ok" types={CAN_PARK} />
      <SignList title="You can't park" tone="no" types={CANT_PARK} />

      <p className="mt-6 px-1 text-sm text-ink-3">The sign at the bay always wins. <a className="font-semibold text-brand underline underline-offset-2" href="./privacy-policy.html">Privacy policy</a></p>
      {/* Required by the data licences (ODbL, CC BY 4.0); kept off the parking screens. */}
      <p className="mt-3 px-1 text-[11px] leading-4 text-ink-3">Map data © OpenStreetMap contributors. Includes City of Melbourne open data (CC BY 4.0).</p>
    </div>
  </main>
}
