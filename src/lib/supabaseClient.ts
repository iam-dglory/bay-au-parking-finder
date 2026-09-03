import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey)

export async function ensureSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: signInData, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return signInData.session
}
