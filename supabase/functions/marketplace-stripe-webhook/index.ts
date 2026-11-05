import { serviceClient } from '../_shared/supabase.ts'
import { sha256, verifyStripeSignature } from '../_shared/stripe.ts'

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const raw = await request.text()
  try {
    const signature = request.headers.get('stripe-signature')
    if (!signature) throw new Error('Missing Stripe signature')
    await verifyStripeSignature(raw, signature)
    const event = JSON.parse(raw)
    const object = event.data?.object ?? {}
    const service = serviceClient()
    const payloadHash = await sha256(raw)

    if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && object.payment_status === 'paid') {
      const { data: bookingId, error } = await service.rpc('marketplace_confirm_checkout', {
        p_event_id: event.id,
        p_event_type: event.type,
        p_api_version: event.api_version ?? null,
        p_livemode: Boolean(event.livemode),
        p_payload_sha256: payloadHash,
        p_checkout_session_ref: object.id,
        p_payment_intent_ref: object.payment_intent,
      })
      if (error) throw error
      if (bookingId) {
        const { data: booking } = await service.from('marketplace_bookings').select('driver_id').eq('id', bookingId).single()
        if (booking?.driver_id) await service.from('analytics_events').upsert({
          user_id: booking.driver_id,
          event_name: 'booking_confirmed',
          properties: { provider: 'stripe' },
          source_key: `booking_confirmed:${bookingId}`,
        }, { onConflict: 'source_key', ignoreDuplicates: true })
      }
    } else if (event.type === 'account.updated') {
      const { error } = await service.from('marketplace_host_profiles').update({
        charges_enabled: Boolean(object.charges_enabled),
        payouts_enabled: Boolean(object.payouts_enabled),
        details_submitted: Boolean(object.details_submitted),
        payout_status: object.charges_enabled && object.payouts_enabled ? 'ready' : 'restricted',
        payment_requirements: object.requirements?.currently_due ?? [],
        payment_account_updated_at: new Date().toISOString(),
      }).eq('payment_account_ref', object.id)
      if (error) throw error
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'payment_intent.payment_failed') {
      await service.from('marketplace_payments').update({ status: 'failed', raw_status: event.type, updated_at: new Date().toISOString() }).eq('payment_intent_ref', object.id)
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'checkout.session.expired') {
      const holdId = object.metadata?.bay_hold_id
      if (holdId) await service.from('marketplace_reservation_holds').update({ status: 'expired' }).eq('id', holdId).eq('status', 'payment_pending')
      await service.from('marketplace_payments').update({ status: 'failed', raw_status: event.type, updated_at: new Date().toISOString() }).eq('checkout_session_ref', object.id).eq('status', 'pending')
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'payment_intent.succeeded') {
      await service.from('marketplace_payments').update({ charge_ref: object.latest_charge ?? null, raw_status: event.type, updated_at: new Date().toISOString() }).eq('payment_intent_ref', object.id)
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'charge.refunded') {
      const status = Number(object.amount_refunded) >= Number(object.amount) ? 'refunded' : 'partially_refunded'
      await service.from('marketplace_payments').update({ status, raw_status: event.type, updated_at: new Date().toISOString() }).eq('charge_ref', object.id)
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'refund.updated' || event.type === 'refund.created') {
      const { data: refund, error: refundLookupError } = await service
        .from('marketplace_refunds')
        .select('id,booking_id,payment_id,refund_percent')
        .eq('provider_ref', object.id)
        .maybeSingle()
      if (refundLookupError) throw refundLookupError
      if (!refund) throw new Error('Refund record is not available yet; retry this event')
      const refundStatus = object.status === 'succeeded' ? 'succeeded' : object.status === 'failed' ? 'failed' : object.status === 'canceled' ? 'cancelled' : 'pending'
      await service.from('marketplace_refunds').update({ status: refundStatus, updated_at: new Date().toISOString() }).eq('id', refund.id)
      if (refundStatus === 'succeeded') {
        await service.from('marketplace_payments').update({ status: refund.refund_percent === 100 ? 'refunded' : 'partially_refunded', updated_at: new Date().toISOString() }).eq('id', refund.payment_id)
        if (refund.refund_percent === 100) await service.from('marketplace_bookings').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('id', refund.booking_id)
      }
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type === 'charge.dispute.created') {
      const { data: payment, error: paymentError } = await service.from('marketplace_payments').select('id,booking_id').eq('charge_ref', object.charge).single()
      if (paymentError) throw paymentError
      await service.from('marketplace_payments').update({ status: 'disputed', raw_status: event.type, updated_at: new Date().toISOString() }).eq('id', payment.id)
      await service.from('marketplace_disputes').upsert({ payment_id: payment.id, booking_id: payment.booking_id, provider_ref: object.id, amount_cents: object.amount ?? 0, reason: object.reason ?? null, status: object.status ?? 'needs_response', evidence_due_at: object.evidence_details?.due_by ? new Date(object.evidence_details.due_by * 1000).toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: 'provider_ref' })
      await recordEvent(service, event, payloadHash, 'processed')
    } else if (event.type.startsWith('payout.')) {
      const accountRef = event.account
      if (!accountRef) throw new Error('Connected-account payout event is missing its account')
      const { data: host } = await service.from('marketplace_host_profiles').select('user_id').eq('payment_account_ref', accountRef).maybeSingle()
      await service.from('marketplace_payouts').upsert({ host_id: host?.user_id ?? null, connected_account_ref: accountRef, provider_ref: object.id, livemode: Boolean(event.livemode), currency: String(object.currency ?? 'aud').toUpperCase(), amount_cents: object.amount ?? 0, arrival_at: object.arrival_date ? new Date(object.arrival_date * 1000).toISOString() : null, status: object.status ?? event.type.replace('payout.', ''), failure_code: object.failure_code ?? null, failure_message: object.failure_message ?? null, updated_at: new Date().toISOString() }, { onConflict: 'provider_ref' })
      await recordEvent(service, event, payloadHash, 'processed')
    } else {
      await recordEvent(service, event, payloadHash, 'ignored')
    }
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Webhook failure')
    return new Response('Webhook processing failed', { status: 400 })
  }
})

async function recordEvent(service: ReturnType<typeof serviceClient>, event: Record<string, any>, payloadHash: string, status: 'processed' | 'ignored') {
  const { error } = await service.from('marketplace_webhook_events').upsert({
    provider: 'stripe',
    event_id: event.id,
    event_type: event.type,
    api_version: event.api_version ?? null,
    livemode: Boolean(event.livemode),
    payload_sha256: payloadHash,
    status,
    attempts: 1,
    processed_at: new Date().toISOString(),
  }, { onConflict: 'provider,event_id', ignoreDuplicates: true })
  if (error) throw error
}
