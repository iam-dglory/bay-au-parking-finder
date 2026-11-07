import { useState } from 'react'
import { ShieldAlert, Trash2 } from 'lucide-react'
import { deleteMyData } from '../lib/deleteMyData'

/** Two-step in-app deletion (required by Google Play and the App Store). */
export function DeleteMyData() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'working' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [keptBookings, setKeptBookings] = useState(false)

  async function run() {
    setStep('working')
    setError(null)
    try {
      const result = await deleteMyData()
      setKeptBookings(!result.accountDeleted)
      setStep('done')
      setTimeout(() => window.location.reload(), result.accountDeleted ? 1500 : 6000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your data.')
      setStep('confirm')
    }
  }

  return <section className="rounded-[26px] border border-[#f3d9d9] bg-surface p-5 shadow-[0_12px_30px_rgba(3,105,161,.06)]">
    <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert className="h-5 w-5" /></span><span><h2 className="text-lg font-bold tracking-tight">Delete my data</h2><p className="mt-0.5 text-sm text-ink-3">Removes your reported signs and photos, parking history, searches, feedback and saved places from Bay.</p></span></div>
    {step === 'idle' && <button onClick={() => setStep('confirm')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"><Trash2 className="h-4 w-4" />Delete my data</button>}
    {(step === 'confirm' || step === 'working') && <div className="mt-4 rounded-2xl bg-red-50 p-4"><p className="text-sm font-semibold text-red-700">This can’t be undone. Your signs will be removed from the map.</p><div className="mt-3 flex gap-2"><button disabled={step === 'working'} onClick={() => void run()} className="min-h-11 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{step === 'working' ? 'Deleting…' : 'Yes, delete everything'}</button><button disabled={step === 'working'} onClick={() => { setStep('idle'); setError(null) }} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold text-ink-3">Cancel</button></div>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>}
    {step === 'done' && <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Your data has been deleted.{keptBookings ? ' Marketplace booking and payment records are kept for refunds, disputes and tax; contact support to close that account.' : ''} Bay will restart with a new session.</p>}
  </section>
}
