import { useMemo, useState } from 'react'
import type { Listing } from '../types'
import { computeBookingTotal, formatMoney, isWithinDeclaredHours } from '../lib/listingAvailability'
import { supabase } from '../lib/supabaseClient'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDays(days: number[]) {
  if (days.length === 7) return 'every day'
  return days
    .slice()
    .sort()
    .map((d) => DAY_NAMES[d])
    .join(', ')
}

function localDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function BookingSheet({
  listing,
  onClose,
  onBooked,
}: {
  listing: Listing | null
  onClose: () => void
  onBooked: () => void
}) {
  const [date, setDate] = useState(() => localDateStr(new Date()))
  const [startTime, setStartTime] = useState('18:00')
  const [durationHours, setDurationHours] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const startsAt = useMemo(() => (date && startTime ? new Date(`${date}T${startTime}:00`) : null), [date, startTime])
  const endsAt = useMemo(() => (startsAt ? new Date(startsAt.getTime() + durationHours * 3600_000) : null), [startsAt, durationHours])

  if (!listing) return null

  const total = computeBookingTotal(listing.price_per_hour, durationHours)
  const outsideHours = startsAt ? !isWithinDeclaredHours(listing, startsAt) : false

  async function handleConfirm() {
    if (!startsAt || !endsAt) return
    setSubmitting(true)
    setError(null)
    const { data: userData } = await supabase.auth.getUser()
    const driverId = userData.user?.id
    const { error: bookingError } = await supabase.from('bookings').insert({
      listing_id: listing!.id,
      driver_id: driverId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      total_price: total,
      currency: listing!.currency,
      status: 'confirmed',
    })
    setSubmitting(false)
    if (bookingError) {
      if (bookingError.code === '23P01') {
        setError("That time's already booked — try another slot.")
      } else {
        setError(bookingError.message)
      }
      return
    }
    setSuccess(true)
    onBooked()
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{listing.address_text}</h2>
            <p className="text-sm text-slate-500">{listing.country}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>

        {listing.description && <p className="mt-3 text-sm text-slate-600">{listing.description}</p>}
        {listing.time_from && listing.time_to && (
          <p className="mt-2 text-xs text-slate-400">
            Usually available {formatDays(listing.days_active)}, {listing.time_from}–{listing.time_to}
          </p>
        )}

        {success ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center">
            <p className="text-2xl">🎉</p>
            <p className="mt-1 font-medium text-emerald-800">Booked!</p>
            <p className="text-sm text-emerald-700">Find it under "My bookings".</p>
            <button onClick={onClose} className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={date}
                  min={localDateStr(new Date())}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Duration (hours)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {outsideHours && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Heads up: this is outside the owner's usual hours. You can still request it.
              </p>
            )}

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-sm text-slate-600">Total</span>
              <span className="font-semibold text-slate-900">{formatMoney(listing.currency, total)}</span>
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={submitting || !startsAt || durationHours <= 0}
              className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Booking…' : `Confirm & pay ${formatMoney(listing.currency, total)} (test — no real charge)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
