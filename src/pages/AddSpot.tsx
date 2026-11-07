import { useState } from 'react'
import { MapView } from '../components/MapView'
import { ReportSpotForm, type ReportSpotFormValue } from '../components/ReportSpotForm'
import { supabase } from '../lib/supabaseClient'
import { uploadSignPhoto } from '../lib/photos'

export function AddSpot({ center, onDone }: { center: { lat: number; lng: number }; onDone: () => void }) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePick(lat: number, lng: number) {
    setPicked({ lat, lng })
  }

  async function handleSubmit(value: ReportSpotFormValue) {
    if (!picked) {
      setError('Tap the map to drop a pin at the sign location first.')
      return
    }
    setSubmitting(true)
    setError(null)

    let photoUrl: string
    try {
      photoUrl = await uploadSignPhoto(value.photo)
    } catch {
      setError('Could not upload the photo. Check your connection and try again.')
      setSubmitting(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    const { data: spot, error: spotError } = await supabase
      .from('parking_spots')
      .insert({ lat: picked.lat, lng: picked.lng, address_text: value.addressText, country: 'Australia', photo_url: photoUrl, created_by: userId })
      .select('id')
      .single()

    if (spotError || !spot) {
      setError(spotError?.message ?? 'Could not save spot')
      setSubmitting(false)
      return
    }

    const { error: ruleError } = await supabase.from('parking_rules').insert(
      value.rules.map((rule) => ({
        spot_id: spot.id,
        sign_type: rule.signType,
        max_stay_minutes: rule.maxStayMinutes,
        days_active: rule.daysActive,
        time_from: rule.timeFrom,
        time_to: rule.timeTo,
        price_per_hour: rule.pricePerHour,
        currency: rule.currency,
        notes: rule.notes,
        created_by: userId,
      })),
    )

    setSubmitting(false)
    if (ruleError) {
      setError(ruleError.message)
      return
    }
    onDone()
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-tint">
      <header className="border-b border-line bg-surface px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Community map</p>
        <div className="mt-2 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-ink">Add a parking sign</h1><p className="mt-1 text-sm text-ink-3">Help someone understand a real sign.</p></div><span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand">Step {picked ? '2' : '1'} of 2</span></div>
        <div className="mt-4 flex gap-2"><span className="h-1.5 flex-1 rounded-full cta" /><span className={`h-1.5 flex-1 rounded-full ${picked ? 'cta' : 'bg-slate-200'}`} /></div>
      </header>
      <div className="h-48 shrink-0 border-b border-slate-200 bg-surface p-2">
        <div className="h-full overflow-hidden rounded-2xl"><MapView center={center} spots={[]} pickMode pickedLocation={picked} onPickLocation={handlePick} /></div>
      </div>
      <p className="mx-4 mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-center text-xs font-medium text-blue-700">
        {!picked ? 'Tap the map to mark exactly where the sign is' : 'Pin placed. Fill in the sign details below.'}
      </p>
      {error && <p className="mx-4 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs text-rose-700">{error}</p>}
      <div className="shrink-0">
        <ReportSpotForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  )
}
