import { useState } from 'react'
import { X, Star, CircleCheck } from 'lucide-react'
import { submitFeedback } from '../lib/feedback'

export function FeedbackForm({ pageContext, onClose }: { pageContext: string; onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitFeedback(message.trim(), rating, pageContext)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Send feedback</h2>
            <p className="text-xs text-slate-500">Tell us what's working or what's broken. We read every one.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CircleCheck className="h-9 w-9 text-emerald-500" strokeWidth={1.75} />
            <p className="text-sm font-medium text-slate-800">Thanks, that's been sent.</p>
            <p className="text-xs text-slate-500">Your testing and feedback are what make this app better.</p>
            <button onClick={onClose} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">How's the app been so far? (optional)</label>
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n === rating ? null : n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                    <Star
                      className={`h-7 w-7 ${rating != null && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">What's on your mind?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A bug, something confusing, an idea, anything at all"
                rows={5}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
