import { useEffect, useState } from 'react'
import { Accessibility, ChevronRight, CircleAlert, Clock3, CreditCard, MapPin, ParkingSquare, ShieldCheck, Truck, UsersRound, XCircle } from 'lucide-react'
import { getSignOptionsForCountry } from '../lib/countrySignPresets'
import { SIGN_AVAILABILITY, SIGN_TYPE_MEANING, GUIDE_COUNTRIES, COUNTRY_GUIDE_INTRO, GUIDE_GENERIC_INTRO } from '../lib/signGuide'
import { detectCountry } from '../lib/geocoding'
import type { SignType } from '../types'

type GuideCountry = (typeof GUIDE_COUNTRIES)[number] | 'Other'

const SIGN_TYPE_ICON: Record<SignType, typeof Clock3> = {
  FREE_UNLIMITED: ParkingSquare,
  TIME_LIMITED: Clock3,
  PAID_METER: CreditCard,
  PERMIT_ONLY: UsersRound,
  NO_STOPPING_CLEARWAY: XCircle,
  LOADING_ZONE: Truck,
  INFORMAL_TOLERATED: MapPin,
  ACCESSIBLE_PERMIT: Accessibility,
}

function SignArtwork({ type, label }: { type: SignType; label: string }) {
  const restricted = SIGN_AVAILABILITY[type] === 'restricted'
  const cardTone = restricted ? 'from-rose-100 via-white to-rose-50' : 'from-sky-100 via-white to-emerald-50'
  const sign = type === 'FREE_UNLIMITED' ? <><span className="text-6xl font-black leading-none text-emerald-700">P</span><span className="mt-1 text-[10px] font-bold tracking-[.12em] text-emerald-800">PARK</span></>
    : type === 'TIME_LIMITED' ? <><span className="text-4xl font-black leading-none text-emerald-700">2P</span><span className="mt-1 text-[9px] font-bold text-emerald-800">8 AM – 6 PM</span><span className="text-[8px] font-bold text-emerald-800">MON – FRI</span></>
    : type === 'PAID_METER' ? <><span className="text-6xl font-black leading-none text-[#1769ff]">P</span><span className="mt-1 text-[10px] font-black tracking-[.12em] text-[#1769ff]">TICKET</span></>
    : type === 'PERMIT_ONLY' ? <><span className="text-xl font-black leading-tight text-rose-700">PERMIT</span><span className="text-xl font-black leading-tight text-rose-700">ONLY</span></>
    : type === 'NO_STOPPING_CLEARWAY' ? <><span className="relative flex h-13 w-13 items-center justify-center rounded-full border-[5px] border-rose-600 text-rose-600"><span className="text-4xl font-black leading-none">X</span><i className="absolute h-1 w-16 rotate-[-45deg] bg-rose-600" /></span><span className="mt-2 text-[9px] font-black tracking-[.1em] text-rose-700">NO STOPPING</span></>
    : type === 'LOADING_ZONE' ? <><span className="rounded-sm bg-rose-600 px-2 py-1 text-lg font-black leading-none text-white">LOADING</span><span className="text-lg font-black leading-none text-rose-700">ZONE</span></>
    : type === 'ACCESSIBLE_PERMIT' ? <span className="text-6xl leading-none text-[#1769ff]">♿</span>
    : <><span className="text-5xl font-black leading-none text-slate-700">P</span><span className="mt-1 text-[9px] font-bold tracking-[.1em] text-slate-600">CHECK LOCALLY</span></>

  return <div className={`relative flex h-29 w-29 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${cardTone} p-2 shadow-inner sm:h-32 sm:w-32`} aria-label={`Illustrated ${label} sign example`}>
    <div className="absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(120deg,transparent_15%,rgba(15,23,42,.08)_15%,rgba(15,23,42,.08)_19%,transparent_19%,transparent_51%,rgba(15,23,42,.06)_51%,rgba(15,23,42,.06)_55%,transparent_55%)]" />
    <div className={`relative flex h-[88%] w-[72%] flex-col items-center justify-center rounded-lg border-2 bg-white/95 px-1 text-center shadow-md ${restricted ? 'border-rose-500' : 'border-[#1769ff]'}`}>{sign}</div>
  </div>
}

function GuideHeroArtwork() {
  return <div aria-hidden="true" className="absolute -right-3 bottom-0 h-40 w-48 overflow-hidden opacity-95 sm:right-6">
    <div className="absolute bottom-2 left-4 h-12 w-20 rounded-t-full bg-blue-100/70" />
    <div className="absolute bottom-8 left-14 h-20 w-9 rounded-t bg-blue-100" />
    <div className="absolute bottom-8 left-25 h-27 w-11 rounded-t bg-blue-100/80" />
    <div className="absolute bottom-8 right-6 h-16 w-10 rounded-t bg-blue-100/70" />
    <div className="absolute bottom-2 left-0 right-0 h-9 rounded-t-[100%] bg-gradient-to-r from-blue-50 via-sky-100 to-blue-50" />
    <div className="absolute bottom-7 right-12 flex h-21 w-17 flex-col items-center justify-center rounded-md border-[3px] border-white bg-[#1769ff] shadow-[0_9px_22px_rgba(23,105,255,.3)]"><span className="text-5xl font-black leading-none text-white">P</span></div>
    <div className="absolute bottom-0 right-[4.1rem] h-9 w-1.5 bg-slate-600" />
    <i className="absolute bottom-2 right-1 h-8 w-2 rounded-full bg-emerald-300" /><i className="absolute bottom-2 right-4 h-12 w-2 rounded-full bg-emerald-300" /><i className="absolute bottom-2 left-8 h-10 w-2 rounded-full bg-emerald-300" />
  </div>
}

export function Guide({ location }: { location: { lat: number; lng: number; country?: string } | null }) {
  const knownCountry = GUIDE_COUNTRIES.find(c => c === location?.country)
  const [country, setCountry] = useState<GuideCountry>(knownCountry ?? 'Australia')
  const [autoDetected, setAutoDetected] = useState(false)

  useEffect(() => {
    if (autoDetected || !location) return
    setAutoDetected(true)
    if (knownCountry) { setCountry(knownCountry); return }
    detectCountry(location.lat, location.lng).then((detected) => {
      const match = GUIDE_COUNTRIES.find((c) => c.toLowerCase() === detected?.toLowerCase())
      if (match) setCountry(match)
    })
  }, [location, autoDetected, knownCountry])

  const signs = getSignOptionsForCountry(country === 'Other' ? undefined : country)
  const intro = country === 'Other' ? GUIDE_GENERIC_INTRO : COUNTRY_GUIDE_INTRO[country]

  return <main className="h-full overflow-y-auto bg-[#f7faff] pb-6 text-[#0b1730]">
    <header className="relative min-h-52 overflow-hidden bg-[radial-gradient(circle_at_22%_0%,#e2f2ff,transparent_42%),linear-gradient(135deg,#ffffff_30%,#eef6ff_100%)] px-5 pb-5 pt-[max(1.4rem,env(safe-area-inset-top))]">
      <GuideHeroArtwork />
      <div className="relative max-w-[65%] sm:max-w-md"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1769ff]">Bay guide</p><h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0b1730]">Understand parking signs</h1><p className="mt-1.5 text-[15px] leading-6 text-[#536b95]">Simple explanations of common parking signs. Always check the physical sign at the location.</p></div>
    </header>

    <div className="flex gap-2 overflow-x-auto border-y border-[#e3edf9] bg-white/80 px-4 py-3 [scrollbar-width:none]">
      {[...GUIDE_COUNTRIES, 'Other'].map((c) => <button key={c} onClick={() => setCountry(c as GuideCountry)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${country === c ? 'border-[#1769ff] bg-[#1769ff] text-white shadow-lg shadow-blue-500/20' : 'border-[#dce7f8] bg-white text-[#385073] hover:border-blue-200 hover:bg-blue-50'}`}>{c}</button>)}
    </div>

    <div className="mx-auto max-w-2xl px-4 pb-7 pt-4">
      <aside className="rounded-2xl border border-blue-100 bg-blue-50/75 p-4 text-sm leading-6 text-[#304b79]"><CircleAlert className="mr-2 inline-block h-5 w-5 -translate-y-0.5 text-[#1769ff]" /><span>{intro}</span></aside>
      <div className="mt-5 flex gap-7 text-sm font-semibold"><span className="flex items-center gap-2 text-emerald-800"><i className="h-3 w-3 rounded-full bg-emerald-500" />Can park</span><span className="flex items-center gap-2 text-rose-700"><i className="h-3 w-3 rounded-full bg-rose-500" />Restricted</span></div>

      <section aria-label={`${country} parking sign guide`} className="mt-4 space-y-3">
        {signs.map((sign) => {
          const usable = SIGN_AVAILABILITY[sign.type] === 'usable'
          const Icon = SIGN_TYPE_ICON[sign.type]
          return <details key={sign.type} className="group overflow-hidden rounded-3xl border border-[#e2ebf7] bg-white shadow-[0_12px_28px_rgba(32,71,125,.07)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 outline-none transition hover:bg-[#fbfdff] [&::-webkit-details-marker]:hidden">
              <SignArtwork type={sign.type} label={sign.label} />
              <div className="min-w-0 flex-1"><h2 className="text-base font-bold leading-5 text-[#0b1730]">{sign.label}</h2><span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${usable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><i className={`h-2 w-2 rounded-full ${usable ? 'bg-emerald-500' : 'bg-rose-500'}`} />{usable ? 'Can park' : 'Restricted'}</span><p className="mt-2 text-sm leading-5 text-[#5b7199]">{SIGN_TYPE_MEANING[sign.type]}</p></div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#2e5b9a] transition group-open:rotate-90" />
            </summary>
            <div className="mx-3 mb-3 flex gap-2 rounded-2xl bg-[#f6f9fe] p-3 text-sm leading-5 text-[#45618c]"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1769ff]" /><p><span className="font-bold text-[#17315c]">What to look for: </span>{sign.hint} Read the whole sign, its arrows and any time or payment instructions before parking.</p></div>
          </details>
        })}
      </section>

      <aside className="mt-5 flex items-start gap-3 rounded-3xl border border-[#e2ebf7] bg-white p-4 shadow-[0_12px_28px_rgba(32,71,125,.06)]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1769ff]"><ShieldCheck className="h-6 w-6" /></span><div><h2 className="font-bold text-[#0b1730]">Privacy &amp; your data</h2><p className="mt-1 text-sm leading-5 text-[#5b7199]">See what Bay stores and how to request access or deletion.</p><a className="mt-1.5 inline-block text-sm font-bold text-[#1769ff] underline underline-offset-2" href="./privacy-policy.html">Read Bay Privacy Policy</a></div><ChevronRight className="mt-3 h-5 w-5 shrink-0 text-[#2e5b9a]" /></aside>
    </div>
  </main>
}
