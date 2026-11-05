import { errorResponse, json, requirePost } from '../_shared/http.ts'
import { authenticatedUser } from '../_shared/supabase.ts'
import { stripeRequest } from '../_shared/stripe.ts'

Deno.serve(async request => {
  try {
    const early = requirePost(request)
    if (early) return early
    const { user, service } = await authenticatedUser(request)
    const input = await request.json()
    const idempotencyKey = request.headers.get('idempotency-key') ?? crypto.randomUUID()
    if (!input.listingId || !input.startsAt || !input.period || !Number.isInteger(input.quantity)) throw new Error('Invalid booking request')

    const { data: hold, error: holdError } = await service.rpc('marketplace_create_reservation_hold', {
      p_driver_id: user.id,
      p_listing_id: input.listingId,
      p_starts_at: input.startsAt,
      p_period: input.period,
      p_quantity: input.quantity,
      p_idempotency_key: idempotencyKey,
    })
    if (holdError) throw holdError

    const { data: listing, error: listingError } = await service
      .from('marketplace_listings')
      .select('id,title,host_id')
      .eq('id', input.listingId)
      .single()
    if (listingError) throw listingError
    const { data: host, error: hostError } = await service
      .from('marketplace_host_profiles')
      .select('payment_account_ref,charges_enabled,payouts_enabled')
      .eq('user_id', listing.host_id)
      .single()
    if (hostError) throw hostError
    if (!host.payment_account_ref || !host.charges_enabled || !host.payouts_enabled) throw new Error('Host payouts are not ready')

    const successUrl = Deno.env.get('MARKETPLACE_CHECKOUT_SUCCESS_URL')
    const cancelUrl = Deno.env.get('MARKETPLACE_CHECKOUT_CANCEL_URL')
    if (!successUrl || !cancelUrl) throw new Error('Checkout return URLs are not configured')
    const session = await stripeRequest('checkout/sessions', {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][unit_amount]': hold.subtotal_cents,
      'line_items[0][price_data][product_data][name]': `BAY parking · ${listing.title}`,
      'line_items[0][quantity]': 1,
      'payment_intent_data[application_fee_amount]': hold.platform_fee_cents,
      'payment_intent_data[transfer_data][destination]': host.payment_account_ref,
      'metadata[bay_hold_id]': hold.id,
      'metadata[bay_listing_id]': listing.id,
      'metadata[bay_driver_id]': user.id,
    }, `bay-checkout-${idempotencyKey}`)

    const { error: attachError } = await service.rpc('marketplace_attach_checkout', {
      p_hold_id: hold.id,
      p_checkout_session_ref: session.id,
      p_connected_account_ref: host.payment_account_ref,
      p_livemode: Boolean(session.livemode),
    })
    if (attachError) {
      await stripeRequest(`checkout/sessions/${session.id}/expire`, {}, `bay-expire-${session.id}`).catch(() => undefined)
      throw attachError
    }
    return json(request, {
      checkoutUrl: session.url,
      expiresAt: session.expires_at,
      quote: {
        subtotalCents: hold.subtotal_cents,
        platformFeeCents: hold.platform_fee_cents,
        driverTotalCents: hold.subtotal_cents,
      },
    })
  } catch (error) {
    return errorResponse(request, error, 400)
  }
})

