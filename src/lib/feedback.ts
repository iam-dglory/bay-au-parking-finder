import { supabase } from './supabaseClient'
import { trackEvent } from './analytics'

export async function submitFeedback(message: string, rating: number | null, pageContext: string) {
  const { error } = await supabase.from('app_feedback').insert({
    message,
    rating,
    page_context: pageContext,
  })
  if (error) throw new Error(error.message)
  trackEvent('feedback_submitted', { feedback_type: 'general', has_rating: rating != null })
}

/** "Something wrong?" on a street or car park. Stored with the feedback so
 * whoever reviews it can find the place again. */
export async function reportPlaceProblem(placeId: string, placeName: string, problem: string, note: string) {
  const message = [`[${problem}] ${placeName}`, note.trim()].filter(Boolean).join('\n')
  const { error } = await supabase.from('app_feedback').insert({ message: message.slice(0, 2000), rating: null, page_context: `place:${placeId}`.slice(0, 200) })
  if (error) throw new Error(error.message)
  trackEvent('feedback_submitted', { feedback_type: 'place_problem', problem })
}
