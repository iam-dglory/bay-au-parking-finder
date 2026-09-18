import { useState } from 'react'
import { CURRENCY_OPTIONS } from '../types'

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export interface ListSpotFormValue {
  addressText: string
  country: string
  currency: string
  pricePerHour: number
  description: string
  daysActive: number[]
  timeFrom: string | null
  timeTo: string | null
}

export function ListSpotForm({ onSubmit, submitting }: { onSubmit: (value: ListSpotFormValue) => void; submitting: boolean }) {
  const [addressText, setAddressText] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [pricePerHour, setPricePerHour] = useState(5)
  const [description, setDescription] = useState('')
  const [alwaysAvailable, setAlwaysAvailable] = useState(true)
  const [daysActive, setDaysActive] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [timeFrom, setTimeFrom] = useState('18:00')
  const [timeTo, setTimeTo] = useState('23:00')

  function toggleDay(d: number) {
    setDaysActive((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  function handleSubmit() {
    if (!addressText.trim() || pricePerHour <= 0) return
    onSubmit({
      addressText: addressText.trim(),
      country: country.trim(),
      currency,
      pricePerHour,
      description: description.trim(),
      daysActive: alwaysAvailable ? [0, 1, 2, 3, 4, 5, 6] : daysActive,
      timeFrom: alwaysAvailable ? null : timeFrom,
      timeTo: alwaysAvailable ? null : timeTo,
    })
  }

  return (
    <div className="space-y-5 p-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Address</label>
        <input
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="e.g. 14 Marine Drive"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Country</label>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. India"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Price per hour</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="e.g. Driveway, easy in-out, fits SUVs"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={alwaysAvailable} onChange={(e) => setAlwaysAvailable(e.target.checked)} />
          Available all day, every day
        </label>
        {!alwaysAvailable && (
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

      <button
        onClick={handleSubmit}
        disabled={!addressText.trim() || pricePerHour <= 0 || submitting}
        className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Saving…' : 'List this spot'}
      </button>
    </div>
  )
}
