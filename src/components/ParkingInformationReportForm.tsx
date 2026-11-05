import { useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { trackEvent } from '../lib/analytics'

const ISSUE_OPTIONS = [
  ['incorrect_location', 'Incorrect location'],
  ['incorrect_restriction', 'Incorrect parking restriction'],
  ['outdated_information', 'Outdated parking information'],
  ['incorrect_price', 'Incorrect price'],
  ['missing_location', 'Missing parking location'],
  ['map_navigation_problem', 'Map or navigation problem'],
  ['other', 'Other issue'],
] as const

type ReportCategory = (typeof ISSUE_OPTIONS)[number][0]

export function ParkingInformationReportForm({
  locationKind,
  locationId,
  locationLabel,
  onClose,
}: {
  locationKind: 'spot' | 'area' | 'missing'
  locationId: string
  locationLabel: string
  onClose: () => void
}) {
  const [category, setCategory] = useState<ReportCategory>('outdated_information')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('Please reopen BAY and try again.')

      let screenshotPath: string | null = null
      if (screenshot) {
        const extension = screenshot.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
        screenshotPath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('parking-report-screenshots')
          .upload(screenshotPath, screenshot, { contentType: screenshot.type || 'image/jpeg', upsert: false })
        if (uploadError) throw uploadError
      }

      const { error: reportError } = await supabase.rpc('submit_parking_information_report', {
        p_category: category,
        p_location_kind: locationKind,
        p_location_identifier: locationId,
        p_location_label: locationLabel.slice(0, 240),
        p_description: description.trim() || null,
        p_screenshot_path: screenshotPath,
      })
      if (reportError) throw reportError
      trackEvent('feedback_submitted', { feedback_type: 'parking_information', category })
      setDone(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send this report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="fixed inset-0 z-[1400] flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-5" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="Report incorrect parking information" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1769ff]">Help improve BAY</p><h2 className="mt-1 text-xl font-bold text-[#0b1730]">Report incorrect parking information</h2><p className="mt-1 text-sm text-[#64748b]">Reports are reviewed before any map or rule is changed.</p></div>
        <button onClick={onClose} className="bay-icon-button h-10 w-10 shrink-0" aria-label="Close report"><X className="h-5 w-5" /></button>
      </div>

      {done ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h3 className="mt-3 text-lg font-bold">Report received</h3><p className="mt-2 text-sm leading-6 text-[#64748b]">BAY will verify it against an authoritative source. Until then, physical signs and local regulations remain authoritative.</p><button onClick={onClose} className="mt-5 rounded-xl bg-[#1769ff] px-5 py-3 text-sm font-bold text-white">Done</button></div> : <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-[#f7faff] px-4 py-3 text-sm"><p className="font-bold text-[#0b1730]">Location</p><p className="mt-1 line-clamp-2 text-[#64748b]">{locationLabel}</p></div>
        <label className="block text-sm font-bold text-[#0b1730]">What is wrong?<select value={category} onChange={event => setCategory(event.target.value as ReportCategory)} className="mt-1.5 min-h-12 w-full rounded-xl border border-[#dce7f8] bg-white px-3 font-normal outline-none focus:border-[#1769ff]">{ISSUE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-sm font-bold text-[#0b1730]">Description <span className="font-normal text-[#64748b]">(optional)</span><textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} rows={4} placeholder="What did you see, and what should be checked?" className="mt-1.5 w-full resize-none rounded-xl border border-[#dce7f8] px-3 py-3 font-normal outline-none focus:border-[#1769ff]" /></label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 px-3 text-sm font-bold text-[#1769ff]"><Camera className="h-4 w-4" />{screenshot ? screenshot.name : 'Add screenshot (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => setScreenshot(event.target.files?.[0] ?? null)} /></label>
        <p className="flex gap-2 rounded-2xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Do not include faces, number plates, access codes or payment details. Always follow the physical sign and local law.</p>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} onClick={() => void submit()} className="min-h-12 w-full rounded-xl bg-[#1769ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Sending report…' : 'Submit report'}</button>
      </div>}
    </section>
  </div>
}
