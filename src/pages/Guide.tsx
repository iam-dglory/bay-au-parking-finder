import { useEffect, useState } from 'react'
import { Clock, DollarSign, IdCard, Ban, Truck, CircleHelp, Accessibility, ParkingCircle } from 'lucide-react'
import { getSignOptionsForCountry } from '../lib/countrySignPresets'
import { SIGN_AVAILABILITY, SIGN_TYPE_MEANING, GUIDE_COUNTRIES, COUNTRY_GUIDE_INTRO, GUIDE_GENERIC_INTRO } from '../lib/signGuide'
import { detectCountry } from '../lib/geocoding'
import type { SignType } from '../types'

type GuideCountry = (typeof GUIDE_COUNTRIES)[number] | 'Other'

const SIGN_TYPE_ICON: Record<SignType, typeof Clock> = {
  FREE_UNLIMITED: ParkingCircle,
  TIME_LIMITED: Clock,
  PAID_METER: DollarSign,
  PERMIT_ONLY: IdCard,
  NO_STOPPING_CLEARWAY: Ban,
  LOADING_ZONE: Truck,
  INFORMAL_TOLERATED: CircleHelp,
  ACCESSIBLE_PERMIT: Accessibility,
}

export function Guide({ location }: { location: { lat: number; lng: number } | null }) {
  const [country, setCountry] = useState<GuideCountry>('Australia')
  const [autoDetected, setAutoDetected] = useState(false)

  // Default the guide to whichever country the app already knows you're in,
  // so it opens on relevant rules instead of always starting on Australia.
  useEffect(() => {
    if (autoDetected || !location) return
    setAutoDetected(true)
    detectCountry(location.lat, location.lng).then((detected) => {
      const match = GUIDE_COUNTRIES.find((c) => c.toLowerCase() === detected?.toLowerCase())
      if (match) setCountry(match)
    })
  }, [location, autoDetected])

  const signs = getSignOptionsForCountry(country === 'Other' ? undefined : country)
  const intro = country === 'Other' ? GUIDE_GENERIC_INTRO : COUNTRY_GUIDE_INTRO[country]

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">Bay guide</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Understand the sign before you park</h1>
        <p className="mt-1 text-sm text-slate-300">Rules shown for {country}. Always confirm the physical sign.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 pt-4 pb-1">
        {[...GUIDE_COUNTRIES, 'Other'].map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c as GuideCountry)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              country === c ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="p-4">
        <p className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-relaxed text-slate-700">{intro}</p>

        <div className="mt-4 flex gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Can park
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Restricted
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {signs.map((s) => {
            const usable = SIGN_AVAILABILITY[s.type] === 'usable'
            const Icon = SIGN_TYPE_ICON[s.type]
            return (
              <div key={s.type} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div
                  className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${
                    usable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{SIGN_TYPE_MEANING[s.type]}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
