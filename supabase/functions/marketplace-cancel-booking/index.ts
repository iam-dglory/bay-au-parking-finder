import { errorResponse, json, requirePost } from '../_shared/http.ts'
import { authenticatedUser } from '../_shared/supabase.ts'
import { stripeRequest } from '../_shared/stripe.ts'

Deno.serve(async request => {
  try {
    const early = requirePost(request)
    if (early) return early
    const { user, service } = await authenticatedUser(request)
    const input = await request.json()
    if (!input.bookingId || typeof input.reason !== 'string' || input.reason.trim().length < 3) throw new Error('Booking and cancellation reason are required')

    const { data: booking, error: bookingError } = await service
      .from('marketplace_bookings')
      .select('id,driver_id,host_id,starts_at,subtotal_cents,status')
      .eq('id', input.bookingId)
      .single()
    if (bookingError) throw bookingError
    if (booking.driver_id !== user.id && booking.host_id !== user.id) throw new Error('Not authorised to cancel this booking')
    if (booking.status !== 'confirmed') throw new Error('This booking cannot be cancelled')
    const hostCancelled = booking.host_id === user.id
    const startsAt = new Date(booking.starts_at).getTime()
    const hoursBeforeStart = (startsAt - Date.now()) / 3_600_000
    const refundPercent = hostCancelled ? 100 : hoursBeforeStart > 24 ? 100 : hoursBeforeStart >= 6 ? 75 : hoursBeforeStart >= 0 ? 50 : 0
    const refundAmountCents = Math.round(Number(booking.subtotal_cents) * refundPercent / 100)

    const { data: payment, error: paymentError } = await service
      .from('marketplace_payments')
      .select('payment_intent_ref')
      .eq('booking_id', booking.id)
      .single()
    if (paymentError) throw paymentError

    let providerRefundRef: string | null = null
    if (refundAmountCents > 0) {
      const refund = await stripeRequest('refunds', {
        payment_intent: payment.payment_intent_ref,
        amount: refundAmountCents,
        reverse_transfer: true,
        refund_application_fee: true,
        reason: 'requested_by_customer',
        'metadata[bay_booking_id]': booking.id,
        'metadata[bay_refund_percent]': refundPercent,
      }, request.headers.get('idempotency-key') ?? `bay-cancel-${booking.id}`)
      if (refund.status !== 'succeeded' && refund.status !== 'pending') throw new Error('Refund was not accepted by the payment provider')
      providerRefundRef = refund.id
    }

    const { error: finaliseError } = await service.rpc('marketplace_finalize_cancellation', {
      p_actor_id: user.id,
      p_booking_id: booking.id,
      p_provider_ref: providerRefundRef,
      p_refund_amount_cents: refundAmountCents,
      p_refund_percent: refundPercent,
      p_reason: input.reason.trim(),
    })
    if (finaliseError) throw finaliseError
    return json(request, { cancelled: true, refundPercent, refundAmountCents })
  } catch (error) {
    return errorResponse(request, error, 400)
  }
})
