import { useState } from 'react'
import { MapView } from '../components/MapView'
import { ListSpotForm, type ListSpotFormValue } from '../components/ListSpotForm'
import { supabase } from '../lib/supabaseClient'

export function ListSpot({ center, onDone }: { center: { lat: number; lng: number }; onDone: () => void }) {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(value: ListSpotFormValue) {
    if (!picked) {
      setError('Tap the map to drop a pin at your spot first.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { data: userData } = await supabase.auth.getUser()
    const ownerId = userData.user?.id
    const { error: listingError } = await supabase.from('listings').insert({
      lat: picked.lat,
      lng: picked.lng,
      address_text: value.addressText,
      country: value.country || null,
      currency: value.currency,
      price_per_hour: value.pricePerHour,
      description: value.description || null,
      days_active: value.daysActive,
      time_from: value.timeFrom,
      time_to: value.timeTo,
      owner_id: ownerId,
    })

    setSubmitting(false)
    if (listingError) {
      setError(listingError.message)
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
        {picked ? 'Pin placed — fill in your listing below' : 'Tap the map to mark exactly where your spot is'}
      </p>
      {error && <p className="bg-rose-50 px-4 py-2 text-center text-xs text-rose-700">{error}</p>}
      <div className="flex-1 overflow-y-auto">
        <ListSpotForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  )
}
