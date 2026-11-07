import { useEffect, useState } from 'react'
import { Check, Copy, RefreshCw, X } from 'lucide-react'
import { supabase, ensureSession } from '../lib/supabaseClient'
import { useSignPhoto } from '../lib/useSignPhoto'

interface QueueItem { id: string; address_text: string; suburb: string | null; state: string | null; country: string | null; lat: number; lng: number; photo_url: string | null; created_at: string; rules: { sign_type: string; max_stay_minutes: number | null; time_from: string | null; time_to: string | null; days_active: number[]; notes: string | null }[] }

/** Review screen for reported signs, opened with ?moderate=1. Only accounts in
 * public.moderators get a queue; everyone else sees their account ID so the
 * owner can add it from the Supabase SQL editor. */
export function Moderate() {
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<QueueItem[] | null>(null)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setError(null)
    const session = await ensureSession().catch(() => null)
    setUserId(session?.user.id ?? null)
    const { data, error: rpcError } = await supabase.rpc('moderation_queue')
    if (rpcError) { if (rpcError.code === '42501' || /moderators only/.test(rpcError.message)) setDenied(true); else setError(rpcError.message); return }
    setDenied(false)
    setItems((data ?? []) as QueueItem[])
  }
  useEffect(() => { void load() }, [])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setBusy(id)
    const { error: rpcError } = await supabase.rpc('moderate_spot', { p_spot_id: id, p_decision: decision })
    setBusy(null)
    if (rpcError) { setError(rpcError.message); return }
    setItems(current => current?.filter(item => item.id !== id) ?? null)
  }

  return <main className="h-full overflow-y-auto bg-tint px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-ink">
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold tracking-tight">Sign review</h1><button onClick={() => void load()} className="bay-icon-button h-10 w-10" aria-label="Refresh queue"><RefreshCw className="h-5 w-5" /></button></div>
      {userId && <p className="mt-2 flex items-center gap-2 text-xs text-ink-3">Account ID: <code className="rounded bg-surface px-1.5 py-0.5">{userId}</code><button aria-label="Copy account ID" onClick={() => void navigator.clipboard?.writeText(userId)}><Copy className="h-3.5 w-3.5" /></button></p>}
      {denied && <p className="mt-4 rounded-2xl bg-surface p-4 text-sm leading-6">This account isn’t a moderator. To make it one, run in the Supabase SQL editor:<br /><code className="mt-2 block break-all rounded bg-slate-50 p-2 text-xs">insert into public.moderators (user_id, note) values ('{userId}', 'your name');</code></p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {items && items.length === 0 && <p className="mt-4 rounded-2xl bg-surface p-5 text-center text-sm text-ink-3">No signs waiting for review.</p>}
      <div className="mt-4 space-y-3">{items?.map(item => <QueueCard key={item.id} item={item} busy={busy === item.id} onDecide={decide} />)}</div>
    </div>
  </main>
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function QueueCard({ item, busy, onDecide }: { item: QueueItem; busy: boolean; onDecide: (id: string, decision: 'approved' | 'rejected') => void }) {
  const photo = useSignPhoto(item.photo_url)
  return <article className="rounded-2xl border border-line bg-surface p-4">
    <h2 className="font-bold">{item.address_text}</h2>
    <p className="text-xs text-ink-3">{[item.suburb, item.state, item.country].filter(Boolean).join(', ')} · reported {new Date(item.created_at).toLocaleString('en-AU')} · <a className="text-brand" href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`} target="_blank" rel="noreferrer">map</a></p>
    {photo ? <img src={photo} alt="Reported sign" className="mt-3 max-h-72 w-full rounded-xl object-contain bg-slate-50" /> : <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-ink-3">Photo unavailable</p>}
    <ul className="mt-3 space-y-1 text-sm">{item.rules.map((rule, i) => <li key={i}>{rule.sign_type.replaceAll('_', ' ').toLowerCase()}{rule.max_stay_minutes ? ` · ${rule.max_stay_minutes} min` : ''}{rule.time_from ? ` · ${rule.time_from.slice(0, 5)}–${rule.time_to?.slice(0, 5)}` : ''} · {rule.days_active.map(d => DAY[d]).join(' ')}</li>)}</ul>
    <p className="mt-2 text-xs text-ink-3">Approve only if the photo clearly shows a sign that matches the rules above.</p>
    <div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => onDecide(item.id, 'approved')} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-60"><Check className="h-4 w-4" />Approve</button><button disabled={busy} onClick={() => onDecide(item.id, 'rejected')} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600 disabled:opacity-60"><X className="h-4 w-4" />Reject</button></div>
  </article>
}
