function required(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}

export function assertStripeConfiguration() {
  if (Deno.env.get('MARKETPLACE_PAYMENTS_ENABLED') !== 'true') throw new Error('Marketplace payments are not enabled')
  if (Deno.env.get('STRIPE_CONNECT_ARCHITECTURE') !== 'express_destination_charges') {
    throw new Error('Stripe Connect architecture has not been approved')
  }
  const key = required('STRIPE_SECRET_KEY')
  const allowLive = Deno.env.get('MARKETPLACE_ALLOW_LIVE_STRIPE') === 'true'
  if (key.startsWith('sk_live_') && !allowLive) throw new Error('Live Stripe mode is locked')
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) throw new Error('Stripe secret key format is invalid')
  return key
}

export async function stripeRequest(path: string, values: Record<string, string | number | boolean | undefined>, idempotencyKey?: string) {
  const secret = assertStripeConfiguration()
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value !== undefined) body.set(key, String(value))
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result?.error?.message ?? 'Stripe request failed')
  return result
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

export async function verifyStripeSignature(payload: string, signatureHeader: string) {
  const secret = required('STRIPE_WEBHOOK_SIGNING_SECRET')
  const fields = signatureHeader.split(',').map(part => part.split('='))
  const timestamp = fields.find(([key]) => key === 't')?.[1]
  const candidates = fields.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || candidates.length === 0) throw new Error('Invalid Stripe signature header')
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error('Stale Stripe webhook')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`)))
  const valid = candidates.some(candidate => constantTimeEqual(candidate, expected))
  if (!valid) throw new Error('Invalid Stripe webhook signature')
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let different = 0
  for (let index = 0; index < left.length; index += 1) different |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return different === 0
}

