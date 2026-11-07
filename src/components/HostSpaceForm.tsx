import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, Home, Loader2, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { MapView } from './MapView'
import {
  MARKETPLACE_PERIODS,
  MARKETPLACE_SPACE_TYPES,
  calculateMarketplaceAmounts,
  formatAudCents,
  type MarketplacePricePeriod,
  type MarketplaceSpaceType,
} from '../lib/marketplace'
import { uploadListingPhotos } from '../lib/photos'
import { supabase } from '../lib/supabaseClient'
import { trackEvent } from '../lib/analytics'

type PriceValues = Record<MarketplacePricePeriod, string>

const EMPTY_PRICES: PriceValues = { hour: '', day: '', week: '', month: '' }

type PricePreview = {
  zone_code: string
  zone_name: string
  period: MarketplacePricePeriod
  minimum_cents: number
  maximum_cents: number
  commission_bps: number
  policy_version_code: string
}

export function HostSpaceForm({ center, onBack }: { center: { lat: number; lng: number }; onBack: () => void }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [picked, setPicked] = useState(center)
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [suburb, setSuburb] = useState('')
  const [state, setState] = useState('VIC')
  const [postcode, setPostcode] = useState('')
  const [spaceType, setSpaceType] = useState<MarketplaceSpaceType>('open_driveway')
  const [accessType, setAccessType] = useState('open')
  const [description, setDescription] = useState('')
  const [prices, setPrices] = useState<PriceValues>(EMPTY_PRICES)
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6])
  const [timeFrom, setTimeFrom] = useState('08:00')
  const [timeTo, setTimeTo] = useState('20:00')
  const [files, setFiles] = useState<File[]>([])
  const [rightsAccepted, setRightsAccepted] = useState(false)
  const [approvalAccepted, setApprovalAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pricePreview, setPricePreview] = useState<PricePreview[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)

  useEffect(() => {
    trackEvent('listing_started')
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setIsAnonymous(data.user?.is_anonymous !== false)
    })
  }, [])

  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files])
  useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)), [previews])

  useEffect(() => {
    if (!userId || isAnonymous) return
    const timer = window.setTimeout(() => {
      setPreviewLoading(true)
      setPreviewMessage(null)
      void (async () => {
        const { data, error: previewError } = await supabase.rpc('marketplace_price_preview', {
          p_lat: picked.lat,
          p_lng: picked.lng,
          p_space_type: spaceType,
        })
        if (previewError) {
          setPricePreview([])
          setPreviewMessage(previewError.message)
        } else {
          const rows = (data ?? []) as PricePreview[]
          setPricePreview(rows)
          setPreviewMessage(rows.length > 0 ? null : 'This pin is not inside a verified BAY pricing zone yet. The listing cannot be submitted until an administrator verifies the zone boundary.')
        }
        setPreviewLoading(false)
      })()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [isAnonymous, picked.lat, picked.lng, spaceType, userId])

  async function sendSignInLink() {
    setError(null)
    if (!email.trim()) { setError('Enter your email address first.'); return }
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    })
    if (signInError) setError(signInError.message)
    else setEmailSent(true)
  }

  function cents(value: string) {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!userId || isAnonymous) { setError('Verify your email before submitting a space.'); return }
    if (!title.trim() || !address.trim() || !suburb.trim() || !state.trim()) { setError('Add a title and complete Australian address.'); return }
    if (files.length < 1) { setError('Add at least one clear photo of the parking space.'); return }
    if (!Object.values(prices).some(value => cents(value) != null)) { setError('Add at least one price.'); return }
    if (pricePreview.length === 0) { setError('This location needs a verified BAY pricing zone before it can be submitted.'); return }
    for (const preview of pricePreview) {
      const proposed = cents(prices[preview.period])
      if (proposed != null && (proposed < preview.minimum_cents || proposed > preview.maximum_cents)) {
        setError(`${preview.period} price must be between ${formatAudCents(preview.minimum_cents)} and ${formatAudCents(preview.maximum_cents)}.`)
        return
      }
    }
    if (days.length === 0 || !timeFrom || !timeTo) { setError('Choose when the space is normally available.'); return }
    if (!rightsAccepted || !approvalAccepted) { setError('Confirm both authority statements before submitting.'); return }

    setSubmitting(true)
    try {
      const photoPaths = await uploadListingPhotos(userId, files)
      const enabledPrices = Object.fromEntries(
        MARKETPLACE_PERIODS.flatMap(({ period }) => {
          const value = cents(prices[period])
          return value == null ? [] : [[period, value]]
        }),
      )
      const { error: insertError } = await supabase.rpc('marketplace_submit_listing_v2', {
        p_title: title.trim(),
        p_description: description.trim(),
        p_address_text: address.trim(),
        p_suburb: suburb.trim(),
        p_state: state.trim().toUpperCase(),
        p_postcode: postcode.trim(),
        p_lat: picked.lat,
        p_lng: picked.lng,
        p_space_type: spaceType,
        p_access_type: accessType,
        p_photo_paths: photoPaths,
        p_availability: { days, from: timeFrom, to: timeTo },
        p_prices: enabledPrices,
        p_rights_attested: rightsAccepted,
        p_approval_attested: approvalAccepted,
      })
      if (insertError) throw insertError
      trackEvent('listing_submitted', { space_type: spaceType, price_periods: Object.keys(enabledPrices).length })
      setSubmitted(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit this space. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <section className="mx-4 mt-4 rounded-[26px] border border-emerald-200 bg-surface p-6 text-center shadow-[0_14px_30px_rgba(3,105,161,.08)]"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h2 className="mt-4 text-xl font-bold">Space sent for review</h2><p className="mt-2 text-sm leading-6 text-ink-3">BAY will verify that the location is private, the photos match and you have authority to offer it. It will not appear to drivers until approved.</p><button onClick={onBack} className="mt-5 min-h-11 rounded-xl cta px-5 py-2.5 text-sm font-bold text-white">Back to parking</button></section>

  if (isAnonymous) return <section className="mx-4 mt-4 rounded-[26px] border border-line bg-surface p-5 shadow-[0_14px_30px_rgba(3,105,161,.08)]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand"><Mail className="h-6 w-6" /></span><h2 className="mt-4 text-xl font-bold">Verify your email to host</h2><p className="mt-2 text-sm leading-6 text-ink-3">A private parking listing is tied to a verified host. Drivers can still browse without signing in.</p>{emailSent ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Check your inbox and open the secure BAY sign-in link.</p> : <div className="mt-4 flex gap-2"><input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-3 text-sm outline-none focus:border-brand" /><button type="button" onClick={() => void sendSignInLink()} className="rounded-xl cta px-4 text-sm font-bold text-white">Send link</button></div>}{error && <p className="mt-3 text-sm text-rose-600">{error}</p>}<button onClick={onBack} className="mt-4 text-sm font-semibold text-brand">Back to available spaces</button></section>

  return <form onSubmit={submit} className="space-y-4 px-4 pb-6">
    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_14px_30px_rgba(3,105,161,.08)]">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">1 · The space</p><h2 className="mt-2 text-xl font-bold">Show drivers exactly what they can book</h2>
      <label className="mt-4 block text-sm font-semibold">Listing title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} placeholder="Secure apartment bay near Southbank" className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal outline-none focus:border-brand" /></label>
      <div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Space type<select value={spaceType} onChange={event => setSpaceType(event.target.value as MarketplaceSpaceType)} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-3 font-normal">{MARKETPLACE_SPACE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><label className="text-sm font-semibold">Access<select value={accessType} onChange={event => setAccessType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-3 font-normal"><option value="open">Open access</option><option value="key">Key handover</option><option value="fob">Building fob</option><option value="gate_code">Gate code</option><option value="attendant">Attendant</option></select></label></div>
      <label className="mt-3 block text-sm font-semibold">Description<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} rows={3} placeholder="Entry, size, lighting and anything a driver should know." className="mt-1.5 w-full resize-none rounded-xl border border-line px-3 py-3 font-normal outline-none focus:border-brand" /></label>
    </section>

    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_14px_30px_rgba(3,105,161,.08)]">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">2 · Location</p><h2 className="mt-2 text-xl font-bold">Pin the private entrance</h2><p className="mt-1 text-sm text-ink-3">BAY shows only an approximate location before booking.</p>
      <div className="mt-4 h-44 overflow-hidden rounded-2xl"><MapView center={picked} spots={[]} pickMode pickedLocation={picked} onPickLocation={(lat, lng) => setPicked({ lat, lng })} /></div>
      <label className="mt-3 block text-sm font-semibold">Street address<input value={address} onChange={event => setAddress(event.target.value)} autoComplete="street-address" className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal" /></label>
      <div className="mt-3 grid grid-cols-3 gap-2"><label className="col-span-2 text-sm font-semibold">Suburb<input value={suburb} onChange={event => setSuburb(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal" /></label><label className="text-sm font-semibold">State<input value={state} onChange={event => setState(event.target.value)} maxLength={3} className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal uppercase" /></label></div>
      <label className="mt-3 block text-sm font-semibold">Postcode<input value={postcode} onChange={event => setPostcode(event.target.value)} inputMode="numeric" maxLength={4} className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal" /></label>
      <div className="mt-4 rounded-2xl bg-tint px-4 py-3 text-sm"><p className="font-bold text-ink">Pricing zone</p>{previewLoading ? <p className="mt-1 text-ink-3">Checking this pin…</p> : pricePreview[0] ? <p className="mt-1 text-brand">{pricePreview[0].zone_name} · {pricePreview[0].policy_version_code}</p> : <p className="mt-1 leading-5 text-amber-700">{previewMessage ?? 'Move the pin to a verified pricing zone.'}</p>}</div>
    </section>

    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_14px_30px_rgba(3,105,161,.08)]">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">3 · Photos & pricing</p><h2 className="mt-2 text-xl font-bold">Set how the space earns</h2>
      <label className="mt-4 flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 px-4 text-sm font-bold text-brand"><Camera className="h-5 w-5" />Add 1–8 clear photos<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={event => setFiles(Array.from(event.target.files ?? []).slice(0, 8))} /></label>
      {previews.length > 0 && <div className="mt-3 grid grid-cols-4 gap-2">{previews.map(preview => <img key={preview.url} src={preview.url} alt="Parking space preview" className="aspect-square rounded-xl object-cover" />)}</div>}
      <div className="mt-4 grid grid-cols-2 gap-3">{MARKETPLACE_PERIODS.map(({ period, label }) => {
        const policy = pricePreview.find(item => item.period === period)
        const proposed = cents(prices[period])
        const allocation = proposed == null || !policy ? null : calculateMarketplaceAmounts(proposed, policy.commission_bps)
        return <label key={period} className="text-sm font-semibold">{label}<span className="mt-1.5 flex rounded-xl border border-line bg-surface focus-within:border-brand"><span className="px-3 py-3 text-ink-3">A$</span><input value={prices[period]} onChange={event => setPrices(current => ({ ...current, [period]: event.target.value }))} inputMode="decimal" placeholder="Optional" className="min-w-0 flex-1 rounded-r-xl py-3 pr-3 font-normal outline-none" /></span>{policy && <span className="mt-1 block text-xs font-normal leading-4 text-ink-3">Allowed {formatAudCents(policy.minimum_cents)}–{formatAudCents(policy.maximum_cents)}{allocation && <> · BAY {formatAudCents(allocation.platformFeeCents)} · You {formatAudCents(allocation.hostPayoutCents)}</>}</span>}</label>
      })}</div>
      <div className="mt-5 border-t border-line pt-4"><p className="text-sm font-semibold">Usually available</p><div className="mt-2 grid grid-cols-7 gap-1">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, day) => <button key={`${label}-${day}`} type="button" onClick={() => setDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort())} className={`aspect-square rounded-lg text-xs font-bold ${days.includes(day) ? 'cta text-white' : 'bg-tint text-ink-3'}`} aria-label={`${days.includes(day) ? 'Remove' : 'Add'} day ${day}`}>{label}</button>)}</div><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-semibold">From<input type="time" value={timeFrom} onChange={event => setTimeFrom(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal" /></label><label className="text-sm font-semibold">Until<input type="time" value={timeTo} onChange={event => setTimeTo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 font-normal" /></label></div></div>
    </section>

    <section className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_14px_30px_rgba(3,105,161,.08)]">
      <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Public roads, kerbs, visitor bays and spaces you do not control cannot be listed.</p>
      <label className="mt-4 flex items-start gap-3 text-sm leading-5"><input type="checkbox" checked={rightsAccepted} onChange={event => setRightsAccepted(event.target.checked)} className="mt-1 h-4 w-4" /><span>I own this parking space or have written authority to rent it. It is not a public-road space.</span></label>
      <label className="mt-3 flex items-start gap-3 text-sm leading-5"><input type="checkbox" checked={approvalAccepted} onChange={event => setApprovalAccepted(event.target.checked)} className="mt-1 h-4 w-4" /><span>I have checked any lease, owners-corporation, building-access and insurance requirements.</span></label>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700">{error}</p>}
      <button disabled={submitting} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl cta px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Home className="h-5 w-5" />}{submitting ? 'Submitting…' : 'Submit space for review'}</button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-3"><MapPin className="h-3.5 w-3.5" />Exact access details stay hidden until a verified booking.</p>
    </section>
  </form>
}
