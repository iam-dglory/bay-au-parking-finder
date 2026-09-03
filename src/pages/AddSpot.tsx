import { useState } from 'react'
import { MapView } from '../components/MapView'
import { ReportSpotForm, type ReportSpotFormValue } from '../components/ReportSpotForm'
import { supabase } from '../lib/supabaseClient'

export function AddSpot({ center, onDone }: { center: { lat: number; lng: number }; onDone: () => void }) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(value: ReportSpotFormValue) {
    if (!picked) {
      setError('Tap the map to drop a pin at the sign location first.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    const { data: spot, error: spotError } = await supabase
      .from('parking_spots')
      .insert({ lat: picked.lat, lng: picked.lng, address_text: value.addressText, created_by: userId })
      .select('id')
      .single()

    if (spotError || !spot) {
      setError(spotError?.message ?? 'Could not save spot')
      setSubmitting(false)
      return
    }

    const { error: ruleError } = await supabase.from('parking_rules').insert({
      spot_id: spot.id,
      sign_type: value.signType,
      max_stay_minutes: value.maxStayMinutes,
      days_active: value.daysActive,
      time_from: value.timeFrom,
      time_to: value.timeTo,
      price_per_hour: value.pricePerHour,
      notes: value.notes || null,
      created_by: userId,
    })

    setSubmitting(false)
    if (ruleError) {
      setError(ruleError.message)
      return
    }
    onDone()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="h-56 shrink-0 border-b border-slate-200">
        <MapView center={center} spots={[]} pickMode pickedLocation={picked} onPickLocation={(lat, lng) => setPicked({ lat, lng })} />
      </div>
      <p className="bg-indigo-50 px-4 py-2 text-center text-xs text-indigo-700">
        {picked ? 'Pin placed — fill in the sign details below' : 'Tap the map to mark exactly where the sign is'}
      </p>
      {error && <p className="bg-rose-50 px-4 py-2 text-center text-xs text-rose-700">{error}</p>}
      <div className="flex-1 overflow-y-auto">
        <ReportSpotForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  )
}
