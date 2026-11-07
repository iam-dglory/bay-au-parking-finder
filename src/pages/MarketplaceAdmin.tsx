import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, DollarSign, Loader2, MapPinned, ShieldCheck, XCircle } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { formatAudCents } from '../lib/marketplace'
import { supabase } from '../lib/supabaseClient'

type Metrics = {
  pending_listings: number
  active_listings: number
  confirmed_bookings: number
  live_gross_booking_cents: number
  test_gross_booking_cents: number
  live_gross_commission_cents: number
  live_processing_fee_cents: number
  live_refund_cents: number
  live_host_payout_cents: number
  pending_refunds: number
  restricted_hosts: number
}

export function MarketplaceAdmin() {
  const [authorised, setAuthorised] = useState<boolean | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [listings, setListings] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [policy, setPolicy] = useState({ version: '', commission: '5', minimum: '5', activate: false })
  const [boundary, setBoundary] = useState({ zone: '', source: '', geojson: '' })

  async function load() {
    const { data: isAdmin } = await supabase.rpc('is_marketplace_admin')
    setAuthorised(Boolean(isAdmin))
    if (!isAdmin) return
    const [metricsResult, listingsResult, zonesResult] = await Promise.all([
      supabase.rpc('marketplace_admin_dashboard_metrics'),
      supabase.from('marketplace_listings').select('id,title,suburb,state,space_type,moderation_status,created_at').eq('moderation_status', 'pending_review').order('created_at'),
      supabase.from('marketplace_pricing_zones').select('code,name,active,boundary_source,boundary_verified_at').order('priority', { ascending: false }),
    ])
    setMetrics(metricsResult.data as Metrics | null)
    setListings(listingsResult.data ?? [])
    setZones(zonesResult.data ?? [])
    setBoundary(current => ({ ...current, zone: current.zone || zonesResult.data?.[0]?.code || '' }))
  }

  useEffect(() => { void load() }, [])

  async function review(id: string, decision: 'active' | 'rejected') {
    setBusy(id)
    setMessage(null)
    const note = decision === 'rejected' ? window.prompt('Reason for rejection (shown to the host):') ?? '' : 'Approved after marketplace moderation review.'
    const { error } = await supabase.rpc('marketplace_admin_review_listing', { p_listing_id: id, p_decision: decision, p_note: note })
    setBusy(null)
    setMessage(error ? error.message : `Listing ${decision === 'active' ? 'approved' : 'rejected'}.`)
    if (!error) await load()
  }

  async function loadBoundaryFile(file: File | undefined) {
    if (!file) return
    if (file.size > 5_000_000) { setMessage('GeoJSON must be smaller than 5 MB.'); return }
    setBoundary(current => ({ ...current, geojson: '' }))
    try {
      const text = await file.text()
      JSON.parse(text)
      setBoundary(current => ({ ...current, geojson: text }))
      setMessage(`Loaded ${file.name}. Confirm its source before activating it.`)
    } catch {
      setMessage('The selected file is not valid JSON.')
    }
  }

  async function saveBoundary() {
    setBusy('boundary')
    const { error } = await supabase.rpc('marketplace_admin_set_zone_boundary', {
      p_zone_code: boundary.zone,
      p_geojson: boundary.geojson,
      p_source: boundary.source,
    })
    setBusy(null)
    setMessage(error ? error.message : 'Verified boundary saved and activated.')
    if (!error) await load()
  }

  async function createPolicy() {
    setBusy('policy')
    const { error } = await supabase.rpc('marketplace_admin_create_policy', {
      p_version_code: policy.version,
      p_commission_bps: Math.round(Number(policy.commission) * 100),
      p_minimum_subtotal_cents: Math.round(Number(policy.minimum) * 100),
      p_activate: policy.activate,
    })
    setBusy(null)
    setMessage(error ? error.message : `Policy ${policy.version} created${policy.activate ? ' and activated' : ' as a draft'}.`)
    if (!error) setPolicy({ version: '', commission: '5', minimum: '5', activate: false })
  }

  if (authorised === null) return <div className="flex h-full items-center justify-center bg-tint"><Loader2 className="h-7 w-7 animate-spin text-brand" /></div>
  if (!authorised) return <main className="flex h-full items-center justify-center bg-tint p-6 text-center"><div><CircleAlert className="mx-auto h-10 w-10 text-amber-600" /><h1 className="mt-4 text-xl font-bold">Marketplace administrator access required</h1><p className="mt-2 text-sm text-ink-3">This page does not expose marketplace records to non-administrators.</p><a href={window.location.pathname} className="mt-5 inline-block text-sm font-bold text-brand">Return to BAY</a></div></main>

  return <main className="h-full overflow-y-auto bg-tint px-4 pb-10 text-ink"><header className="mx-auto max-w-5xl pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]"><div className="flex items-center justify-between"><BrandMark size="sm" /><a href={window.location.pathname} className="text-sm font-bold text-brand">Exit admin</a></div><p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-brand">Restricted operations</p><h1 className="mt-2 text-3xl font-bold">Marketplace control room</h1><p className="mt-2 text-sm text-ink-3">Moderation, sourced zone geometry and versioned commercial policy.</p></header>
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
      <section className="lg:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-4">{metrics && [
        ['Pending listings', metrics.pending_listings], ['Active listings', metrics.active_listings], ['Confirmed bookings', metrics.confirmed_bookings], ['Live gross booking value', formatAudCents(metrics.live_gross_booking_cents)],
        ['Test gross booking value', formatAudCents(metrics.test_gross_booking_cents)], ['Live gross commission', formatAudCents(metrics.live_gross_commission_cents)], ['Recorded processing costs', formatAudCents(metrics.live_processing_fee_cents)], ['Live refunds', formatAudCents(metrics.live_refund_cents)], ['Live host payouts', formatAudCents(metrics.live_host_payout_cents)], ['Pending refunds', metrics.pending_refunds], ['Restricted hosts', metrics.restricted_hosts],
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-ink-3">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</section>

      <AdminCard icon={ShieldCheck} title="Pending listing moderation"><div className="mt-4 space-y-2">{listings.length ? listings.map(listing => <div key={listing.id} className="rounded-2xl border border-line p-3"><p className="font-bold">{listing.title}</p><p className="mt-1 text-xs text-ink-3">{listing.space_type.replaceAll('_', ' ')} · {[listing.suburb, listing.state].filter(Boolean).join(', ')}</p><div className="mt-3 flex gap-2"><button disabled={busy === listing.id} onClick={() => void review(listing.id, 'active')} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" />Approve</button><button disabled={busy === listing.id} onClick={() => void review(listing.id, 'rejected')} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700"><XCircle className="h-4 w-4" />Reject</button></div></div>) : <p className="text-sm text-ink-3">No listings are waiting for review.</p>}</div></AdminCard>

      <AdminCard icon={MapPinned} title="Verified pricing-zone geometry"><div className="mt-4 space-y-3"><select value={boundary.zone} onChange={event => setBoundary(current => ({ ...current, zone: event.target.value }))} className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm">{zones.map(zone => <option key={zone.code} value={zone.code}>{zone.name} · {zone.active ? 'active' : 'inactive'}</option>)}</select><input value={boundary.source} onChange={event => setBoundary(current => ({ ...current, source: event.target.value }))} placeholder="Boundary source URL or registry reference" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /><input type="file" accept="application/geo+json,application/json,.geojson" onChange={event => void loadBoundaryFile(event.target.files?.[0])} className="block w-full text-xs text-ink-3" /><button disabled={!boundary.geojson || !boundary.source || busy === 'boundary'} onClick={() => void saveBoundary()} className="min-h-11 w-full rounded-xl cta text-sm font-bold text-white disabled:opacity-50">Validate and activate boundary</button><p className="text-xs leading-5 text-ink-3">Only sourced, reviewed Polygon/MultiPolygon GeoJSON is accepted. Overlaps use the documented priority and smallest-area order.</p></div></AdminCard>

      <AdminCard icon={DollarSign} title="Create a policy version"><div className="mt-4 grid grid-cols-2 gap-3"><label className="col-span-2 text-xs font-bold">Version code<input value={policy.version} onChange={event => setPolicy(current => ({ ...current, version: event.target.value }))} placeholder="launch-au-v2" className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Commission %<input value={policy.commission} onChange={event => setPolicy(current => ({ ...current, commission: event.target.value }))} inputMode="decimal" className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Minimum A$<input value={policy.minimum} onChange={event => setPolicy(current => ({ ...current, minimum: event.target.value }))} inputMode="decimal" className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-sm font-normal" /></label><label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={policy.activate} onChange={event => setPolicy(current => ({ ...current, activate: event.target.checked }))} />Activate immediately (otherwise save as draft)</label><button disabled={!policy.version || busy === 'policy'} onClick={() => void createPolicy()} className="col-span-2 min-h-11 rounded-xl cta text-sm font-bold text-white disabled:opacity-50">Create versioned policy</button></div></AdminCard>
    </div>
    {message && <p className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,36rem)] -translate-x-1/2 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">{message}</p>}
  </main>
}

function AdminCard({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: import('react').ReactNode }) {
  return <section className="rounded-[26px] border border-line bg-surface p-5 shadow-[0_12px_30px_rgba(3,105,161,.06)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand"><Icon className="h-5 w-5" /></span><h2 className="text-lg font-bold">{title}</h2></div>{children}</section>
}
