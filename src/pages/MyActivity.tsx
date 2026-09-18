import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SpotCard } from '../components/SpotCard'
import { SpotDetailSheet } from '../components/SpotDetailSheet'
import { evaluateSpotStatus } from '../lib/parkingStatus'
import { formatMoney } from '../lib/listingAvailability'
import type { ParkingSpot, SpotStatus, Booking } from '../types'

interface ListingWithBookings {
  id: string
  address_text: string
  currency: string
  price_per_hour: number
  bookings: Booking[]
}

interface BookingWithListing extends Booking {
  listings: { address_text: string } | null
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function MyActivity({ center }: { center: { lat: number; lng: number } }) {
  const [signs, setSigns] = useState<(ParkingSpot & { status: SpotStatus })[]>([])
  const [listings, setListings] = useState<ListingWithBookings[]>([])
  const [bookings, setBookings] = useState<BookingWithListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSign, setSelectedSign] = useState<(ParkingSpot & { status: SpotStatus }) | null>(null)

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setLoading(false)
      return
    }

    const [signsRes, listingsRes, bookingsRes] = await Promise.all([
      supabase
        .from('parking_spots')
        .select('id, address_text, suburb, state, lat, lng, created_by, parking_rules(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('listings')
        .select('id, address_text, currency, price_per_hour, bookings(*)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*, listings(address_text)')
        .eq('driver_id', userId)
        .order('starts_at', { ascending: false }),
    ])

    setSigns(
      (signsRes.data ?? []).map((row: any) => {
        const spot: ParkingSpot = {
          id: row.id,
          address_text: row.address_text,
          suburb: row.suburb,
          state: row.state,
          lat: row.lat,
          lng: row.lng,
          distance_m: 0,
          created_by: row.created_by,
          rules: row.parking_rules ?? [],
        }
        return { ...spot, status: evaluateSpotStatus(spot.rules) }
      }),
    )
    setListings((listingsRes.data ?? []) as ListingWithBookings[])
    setBookings((bookingsRes.data ?? []) as BookingWithListing[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [center.lat, center.lng])

  async function cancelBooking(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    load()
  }

  if (loading) {
    return <p className="p-4 text-center text-sm text-slate-400">Loading…</p>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-base font-semibold text-slate-900">My activity</h1>
        <p className="text-xs text-slate-500">Everything you've reported, listed, and booked</p>
      </div>

      <section className="p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Signs I've reported</h2>
        {signs.length === 0 && <p className="text-sm text-slate-400">No signs reported yet.</p>}
        <div className="space-y-2">
          {signs.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onClick={() => setSelectedSign(spot)} />
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Spots I'm renting out</h2>
        {listings.length === 0 && <p className="text-sm text-slate-400">You haven't listed any spots yet.</p>}
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
              <p className="font-medium text-slate-900">{listing.address_text}</p>
              <p className="text-sm text-slate-500">{formatMoney(listing.currency, listing.price_per_hour)}/hr</p>
              {listing.bookings.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No bookings yet.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {listing.bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs">
                      <span className={b.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-700'}>{formatWhen(b.starts_at)}</span>
                      <span className="font-medium text-slate-700">{formatMoney(b.currency, b.total_price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">My bookings</h2>
        {bookings.length === 0 && <p className="text-sm text-slate-400">You haven't booked anything yet.</p>}
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{b.listings?.address_text ?? 'Listing removed'}</p>
                  <p className="text-sm text-slate-500">{formatWhen(b.starts_at)}</p>
                </div>
                <span className="font-semibold text-slate-900">{formatMoney(b.currency, b.total_price)}</span>
              </div>
              {b.status === 'cancelled' ? (
                <p className="mt-2 text-xs font-medium text-rose-500">Cancelled</p>
              ) : (
                <button onClick={() => cancelBooking(b.id)} className="mt-2 text-xs font-medium text-slate-400 underline hover:text-slate-600">
                  Cancel booking
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <SpotDetailSheet spot={selectedSign} onClose={() => setSelectedSign(null)} />
    </div>
  )
}
