import { supabase } from './supabaseClient'
import { trackEvent } from './analytics'

export type KerbSignNote = { signText: string; reviewedAt: string | null }

let approved: Promise<Map<string, KerbSignNote>> | null = null

/** Sign text drivers reported for blocks with no council rules, once an
 * operator has approved it. Loaded once per session; empty on any error. */
export function approvedSignNotes(): Promise<Map<string, KerbSignNote>> {
  approved ??= (async () => {
    const { data, error } = await supabase.rpc('approved_kerb_sign_notes')
    if (error || !Array.isArray(data)) return new Map()
    return new Map((data as { block: string; sign_text: string; reviewed_at: string | null }[])
      .map(row => [row.block, { signText: row.sign_text, reviewedAt: row.reviewed_at }]))
  })().catch(() => new Map())
  return approved
}

/** Send what the sign says for a block. It's shown to others only after review. */
export async function submitSignNote(block: string, signText: string): Promise<void> {
  const text = signText.trim().slice(0, 200)
  if (text.length < 2) throw new Error('Too short')
  const { error } = await supabase.from('kerb_sign_notes').insert({ block: block.slice(0, 200), sign_text: text })
  // A note for this block is already waiting for review: nothing more to do.
  if (error && error.code !== '23505') throw new Error(error.message)
  trackEvent('feedback_submitted', { feedback_type: 'kerb_sign_note' })
}
