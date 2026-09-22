import { supabase } from './supabaseClient'

/** Assigns (or looks up) a stable, sequential tester number for the current
 * anonymous session, e.g. "Test User 3" -- purely for the pilot testing
 * phase, so different testers can tell their own activity apart without any
 * personal data (name, email, IP address) ever being collected. */
export async function getTesterNumber(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_or_create_tester_number')
  if (error) return null
  return data
}
