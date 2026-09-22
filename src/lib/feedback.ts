import { supabase } from './supabaseClient'

export async function submitFeedback(message: string, rating: number | null, pageContext: string) {
  const { error } = await supabase.from('app_feedback').insert({
    message,
    rating,
    page_context: pageContext,
  })
  if (error) throw new Error(error.message)
}
