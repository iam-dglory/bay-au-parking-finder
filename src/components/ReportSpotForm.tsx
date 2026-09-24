import { useEffect, useState } from 'react'
import { X, Camera as CameraIcon, RotateCcw } from 'lucide-react'
import type { SignType } from '../types'
import { getSignOptionsForCountry, hasLocalPreset, getDefaultCurrency } from '../lib/countrySignPresets'
import { CURRENCY_OPTIONS } from '../types'
import { captureSignPhoto, type CapturedPhoto } from '../lib/photos'

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

/** Common Australian max-stay durations — signs go as short as "15 MIN" outside shops. */
const MAX_STAY_PRESETS_HOURS = [0.25, 0.5, 1, 2, 4]

export interface RuleInput {
  signType: SignType
  maxStayMinutes: number | null
  daysActive: number[]
  timeFrom: string | null
  timeTo: string | null
  pricePerHour: number | null
  currency: string | null
  notes: string | null
}

export interface ReportSpotFormValue {
  addressText: string
  rules: RuleInput[]
  photo: CapturedPhoto
}

const KNOWN_COUNTRIES = ['Australia', 'India', 'United States', 'United Kingdom']
const ALWAYS_FREE_TYPES: SignType[] = ['FREE_UNLIMITED', 'INFORMAL_TOLERATED']

function formatMaxStay(hours: number) {
  if (hours < 1) return `${hours * 60} min`
  return hours === 1 ? '1h' : `${hours}h`
}

function summarizeRule(rule: RuleInput, label: string) {
  const days = rule.daysActive.length === 7 ? 'every day' : DAYS.filter((d) => rule.daysActive.includes(d.value)).map((d) => d.label).join(' ')
  const time = rule.timeFrom && rule.timeTo && !(rule.timeFrom === '00:00' && rule.timeTo === '23:59') ? ` ${rule.timeFrom}–${rule.timeTo}` : ''
  const stay = rule.maxStayMinutes ? ` · max ${formatMaxStay(rule.maxStayMinutes / 60)}` : ''
  return `${label} · ${days}${time}${stay}`
}

export function ReportSpotForm({
  country,
  onCountryChange,
  onSubmit,
  submitting,
}: {
  country: string | null
  onCountryChange: (country: string) => void
  onSubmit: (value: ReportSpotFormValue) => void
  submitting: boolean
}) {
  const [addressText, setAddressText] = useState('')
  const [signType, setSignType] = useState<SignType | null>(null)
  const [hasMaxStay, setHasMaxStay] = useState(false)
  const [maxStayHours, setMaxStayHours] = useState(2)
  const [daysActive, setDaysActive] = useState<number[]>([1, 2, 3, 4, 5])
  const [timeFrom, setTimeFrom] = useState('08:30')
  const [timeTo, setTimeTo] = useState('18:00')
  const [pricePerHour, setPricePerHour] = useState(5)
  const [currency, setCurrency] = useState(() => getDefaultCurrency(country))
  const [allDay, setAllDay] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedRules, setSavedRules] = useState<RuleInput[]>([])
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [capturingPhoto, setCapturingPhoto] = useState(false)

  async function handleCapturePhoto() {
    setCapturingPhoto(true)
    const captured = await captureSignPhoto()
    if (captured) setPhoto(captured)
    setCapturingPhoto(false)
  }

  useEffect(() => {
    setCurrency(getDefaultCurrency(country))
  }, [country])

  const signOptions = getSignOptionsForCountry(country)
  const isAlwaysFree = signType ? ALWAYS_FREE_TYPES.includes(signType) : false
  const needsTimeWindow = signType && !isAlwaysFree
  const maxStayRequired = signType === 'TIME_LIMITED'
  const maxStayOptional = signType === 'PAID_METER'
  const showMaxStayInput = maxStayRequired || (maxStayOptional && hasMaxStay)
  const needsPrice = signType === 'PAID_METER'

  function toggleDay(d: number) {
    setDaysActive((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  function resetRuleFields() {
    setSignType(null)
    setHasMaxStay(false)
    setMaxStayHours(2)
    setDaysActive([1, 2, 3, 4, 5])
    setTimeFrom('08:30')
    setTimeTo('18:00')
    setPricePerHour(5)
    setAllDay(false)
    setNotes('')
  }

  function currentRuleAsInput(): RuleInput | null {
    if (!signType) return null
    return {
      signType,
      maxStayMinutes: showMaxStayInput ? maxStayHours * 60 : null,
      daysActive: isAlwaysFree || allDay ? [0, 1, 2, 3, 4, 5, 6] : daysActive,
      timeFrom: needsTimeWindow && !allDay ? timeFrom : isAlwaysFree ? null : '00:00',
      timeTo: needsTimeWindow && !allDay ? timeTo : isAlwaysFree ? null : '23:59',
      pricePerHour: needsPrice ? pricePerHour : null,
      currency: needsPrice ? currency : null,
      notes: notes || null,
    }
  }

  function handleAddAnotherPeriod() {
    const rule = currentRuleAsInput()
    if (!rule) return
    setSavedRules((prev) => [...prev, rule])
    resetRuleFields()
  }

  function removeSavedRule(index: number) {
    setSavedRules((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    const current = currentRuleAsInput()
    const rules = current ? [...savedRules, current] : savedRules
    if (!addressText.trim() || rules.length === 0 || !photo) return
    onSubmit({ addressText: addressText.trim(), rules, photo })
  }

  const canSave = addressText.trim() && (savedRules.length > 0 || signType) && photo

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <label className="text-sm font-medium text-slate-700">Street address</label>
        <input
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="e.g. 483 George St"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Country</label>
        <input
          list="known-countries"
          value={country ?? ''}
          onChange={(e) => onCountryChange(e.target.value)}
          placeholder="Detecting from map pin…"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <datalist id="known-countries">
          {KNOWN_COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-slate-400">
          {hasLocalPreset(country)
            ? `Showing sign types that match how parking is usually signed in ${country}.`
            : "Showing a generic set. This country doesn't have a tailored list yet, but reporting still works fine."}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Photo of the sign (required)</label>
        <p className="mt-0.5 text-xs text-slate-400">Every report is checked against its photo before it's shown to other people. This keeps the map trustworthy.</p>
        {photo ? (
          <div className="mt-2 space-y-2">
            <img src={photo.previewUrl} alt="Captured parking sign" className="h-40 w-full rounded-lg object-cover" />
            <button
              onClick={handleCapturePhoto}
              disabled={capturingPhoto}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} /> Retake photo
            </button>
          </div>
        ) : (
          <button
            onClick={handleCapturePhoto}
            disabled={capturingPhoto}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 py-5 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
          >
            <CameraIcon className="h-4 w-4" strokeWidth={2} /> {capturingPhoto ? 'Opening camera…' : 'Take a photo of the sign'}
          </button>
        )}
      </div>

      {savedRules.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-700">Time periods added so far</label>
          <div className="mt-2 space-y-1.5">
            {savedRules.map((r, i) => {
              const label = signOptions.find((o) => o.type === r.signType)?.label ?? r.signType
              return (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                  <span>{summarizeRule(r, label)}</span>
                  <button onClick={() => removeSavedRule(i)} aria-label="Remove this time period" className="shrink-0 text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">
          {savedRules.length > 0 ? 'Add another time period for this sign' : 'What does the sign say?'}
        </label>
        {savedRules.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-400">
            Many Australian signs stack several plates, e.g. "2P Mon–Fri", "1P Sat", "Free Sun". Add each one separately.
          </p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {signOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setSignType(opt.type)
                setHasMaxStay(false)
              }}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                signType === opt.type ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className={`text-xs ${signType === opt.type ? 'text-slate-300' : 'text-slate-400'}`}>{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {maxStayOptional && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasMaxStay} onChange={(e) => setHasMaxStay(e.target.checked)} />
          Also has a max stay limit (e.g. "2P Ticket")
        </label>
      )}

      {showMaxStayInput && (
        <div>
          <label className="text-sm font-medium text-slate-700">Max stay</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {MAX_STAY_PRESETS_HOURS.map((h) => (
              <button
                key={h}
                onClick={() => setMaxStayHours(h)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  maxStayHours === h ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {formatMaxStay(h)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={maxStayHours}
            onChange={(e) => setMaxStayHours(Number(e.target.value))}
            className="mt-2 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <span className="ml-2 text-xs text-slate-400">hours</span>
        </div>
      )}

      {needsPrice && (
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
              min={0}
              step={0.5}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value))}
              className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
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
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {signType && (
        <button
          onClick={handleAddAnotherPeriod}
          className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          + Save this period &amp; add another (e.g. different days/hours)
        </button>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSave || submitting}
        className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Saving…' : 'Save parking sign'}
      </button>
    </div>
  )
}
