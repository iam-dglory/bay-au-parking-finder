// Sends the owner an email for each queued waitlist signup (public.waitlist_notifications).
//
// Deploy:   supabase functions deploy waitlist-notify --no-verify-jwt
// Secrets:  supabase secrets set RESEND_API_KEY=... NOTIFY_TO=you@example.com NOTIFY_FROM="Bay <waitlist@yourdomain>" CRON_SECRET=...
// Schedule: see migration 20261105110000_schedule_waitlist_notify.sql (pg_cron + pg_net, every 5 minutes).
//
// Only the owner is emailed. Subscribers are never contacted by this function.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const env = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing secret ${name}`)
  return value
}

Deno.serve(async (request) => {
  if (request.headers.get('authorization') !== `Bearer ${env('CRON_SECRET')}`) return new Response('unauthorized', { status: 401 })
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })

  const { data: queue, error } = await db
    .from('waitlist_notifications')
    .select('signup_id, attempts, waitlist_signups(email, device, country_code, created_at)')
    .is('sent_at', null)
    .lt('attempts', 5)
    .order('created_at')
    .limit(20)
  if (error) return new Response(error.message, { status: 500 })

  let sent = 0
  for (const item of queue ?? []) {
    const signup = item.waitlist_signups as unknown as { email: string; device: string | null; country_code: string | null; created_at: string } | null
    if (!signup) continue
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env('NOTIFY_FROM'),
        to: env('NOTIFY_TO').split(',').map(address => address.trim()),
        subject: `New Bay waitlist signup (${signup.country_code ?? '—'}, ${signup.device ?? '—'})`,
        text: `Email: ${signup.email}\nDevice: ${signup.device ?? '—'}\nCountry: ${signup.country_code ?? '—'}\nSigned up: ${signup.created_at}`,
      }),
    })
    const ok = response.ok
    await db.from('waitlist_notifications').update({
      attempts: item.attempts + 1,
      sent_at: ok ? new Date().toISOString() : null,
      last_error: ok ? null : `${response.status} ${(await response.text()).slice(0, 300)}`,
    }).eq('signup_id', item.signup_id)
    if (ok) sent++
  }
  return Response.json({ checked: queue?.length ?? 0, sent })
})
