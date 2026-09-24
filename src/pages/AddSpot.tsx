import { useState } from 'react'
import { MapView } from '../components/MapView'
import { ReportSpotForm, type ReportSpotFormValue } from '../components/ReportSpotForm'
import { supabase } from '../lib/supabaseClient'
import { detectCountry } from '../lib/geocoding'
import { uploadSignPhoto } from '../lib/photos'

export function AddSpot({ center, onDone }: { center: { lat: number; lng: number }; onDone: () => void }) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePick(lat: number, lng: number) {
    setPicked({ lat, lng })
    setDetecting(true)
    const detected = await detectCountry(lat, lng)
    setCountry(detected)
    setDetecting(false)
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
      .insert({ lat: picked.lat, lng: picked.lng, address_text: value.addressText, country, photo_url: photoUrl, created_by: userId })
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
    <div className="flex h-full flex-col overflow-y-auto bg-[#f6f8fc]">
      <div className="border-b border-slate-200/80 bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Community map</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Add a sign</h1>
        <p className="mt-1 text-sm text-slate-500">Drop a pin where the sign actually is</p>
      </div>
      <div className="h-48 shrink-0 border-b border-slate-200 bg-white p-2">
        <div className="h-full overflow-hidden rounded-2xl"><MapView center={center} spots={[]} pickMode pickedLocation={picked} onPickLocation={handlePick} /></div>
      </div>
      <p className="mx-4 mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-center text-xs font-medium text-blue-700">
        {!picked ? 'Tap the map to mark exactly where the sign is' : detecting ? 'Pin placed. Detecting your country...' : 'Pin placed. Fill in the sign details below.'}
      </p>
      {error && <p className="mx-4 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs text-rose-700">{error}</p>}
      <div className="shrink-0">
        <ReportSpotForm country={country} onCountryChange={setCountry} onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  )
}
