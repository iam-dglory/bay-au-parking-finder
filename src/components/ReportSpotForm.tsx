import { useState } from 'react'
import type { SignType } from '../types'

const SIGN_OPTIONS: { type: SignType; label: string; hint: string }[] = [
  { type: 'FREE_UNLIMITED', label: 'Free, no limit', hint: 'Plain "P" sign, no restrictions' },
  { type: 'TIME_LIMITED', label: 'Free, time limited', hint: 'e.g. 1P, 2P, 4P signs' },
  { type: 'PAID_METER', label: 'Paid / ticket', hint: 'Meter or pay-by-app parking' },
  { type: 'PERMIT_ONLY', label: 'Permit only', hint: 'Resident permit holders' },
  { type: 'NO_STOPPING_CLEARWAY', label: 'Clearway', hint: 'No stopping during set hours' },
  { type: 'LOADING_ZONE', label: 'Loading zone', hint: 'Reserved for loading vehicles' },
]

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export interface ReportSpotFormValue {
  addressText: string
  signType: SignType
  maxStayMinutes: number | null
  daysActive: number[]
  timeFrom: string | null
  timeTo: string | null
  pricePerHour: number | null
  notes: string
}

export function ReportSpotForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (value: ReportSpotFormValue) => void
  submitting: boolean
}) {
  const [addressText, setAddressText] = useState('')
  const [signType, setSignType] = useState<SignType | null>(null)
  const [maxStayHours, setMaxStayHours] = useState(2)
  const [daysActive, setDaysActive] = useState<number[]>([1, 2, 3, 4, 5])
  const [timeFrom, setTimeFrom] = useState('08:30')
  const [timeTo, setTimeTo] = useState('18:00')
  const [pricePerHour, setPricePerHour] = useState(5)
  const [allDay, setAllDay] = useState(false)
  const [notes, setNotes] = useState('')

  const needsTimeWindow = signType && signType !== 'FREE_UNLIMITED'
  const needsMaxStay = signType === 'TIME_LIMITED'
  const needsPrice = signType === 'PAID_METER'

  function toggleDay(d: number) {
    setDaysActive((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  function handleSubmit() {
    if (!signType || !addressText.trim()) return
    onSubmit({
      addressText: addressText.trim(),
      signType,
      maxStayMinutes: needsMaxStay ? maxStayHours * 60 : null,
      daysActive: signType === 'FREE_UNLIMITED' || allDay ? [0, 1, 2, 3, 4, 5, 6] : daysActive,
      timeFrom: needsTimeWindow && !allDay ? timeFrom : signType === 'FREE_UNLIMITED' ? null : '00:00',
      timeTo: needsTimeWindow && !allDay ? timeTo : signType === 'FREE_UNLIMITED' ? null : '23:59',
      pricePerHour: needsPrice ? pricePerHour : null,
      notes,
    })
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Street address</label>
        <input
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="e.g. 483 George St"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">What does the sign say?</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SIGN_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSignType(opt.type)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                signType === opt.type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className={`text-xs ${signType === opt.type ? 'text-slate-300' : 'text-slate-400'}`}>{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {needsMaxStay && (
        <div>
          <label className="text-sm font-medium text-slate-700">Max stay (hours)</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={maxStayHours}
            onChange={(e) => setMaxStayHours(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      )}

      {needsPrice && (
        <div>
          <label className="text-sm font-medium text-slate-700">Price per hour ($)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      )}

      {needsTimeWindow && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Applies all day, every day
          </label>
          {!allDay && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">Which days?</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => toggleDay(d.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        daysActive.includes(d.value) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">From</label>
                  <input
                    type="time"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">To</label>
                  <input
                    type="time"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!signType || !addressText.trim() || submitting}
        className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Saving…' : 'Save parking sign'}
      </button>
    </div>
  )
}
