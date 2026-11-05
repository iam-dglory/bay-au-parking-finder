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
