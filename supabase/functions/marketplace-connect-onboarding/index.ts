import { errorResponse, json, requirePost } from '../_shared/http.ts'
import { authenticatedUser } from '../_shared/supabase.ts'
import { stripeRequest } from '../_shared/stripe.ts'

Deno.serve(async request => {
  try {
    const early = requirePost(request)
    if (early) return early
    const { user, service } = await authenticatedUser(request)
    const returnUrl = Deno.env.get('MARKETPLACE_CONNECT_RETURN_URL')
    const refreshUrl = Deno.env.get('MARKETPLACE_CONNECT_REFRESH_URL')
    if (!returnUrl || !refreshUrl) throw new Error('Connect return URLs are not configured')

    const { data: profile, error: profileError } = await service
      .from('marketplace_host_profiles')
      .select('payment_account_ref')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profileError) throw profileError

    let accountId = profile?.payment_account_ref as string | undefined
    if (!accountId) {
      const account = await stripeRequest('accounts', {
        type: 'express',
        country: 'AU',
        email: user.email,
        'capabilities[card_payments][requested]': true,
        'capabilities[transfers][requested]': true,
        'metadata[bay_user_id]': user.id,
      }, `bay-connect-account-${user.id}`)
      accountId = account.id
      const { error } = await service.from('marketplace_host_profiles').upsert({
        user_id: user.id,
        payment_account_ref: accountId,
        payout_status: 'pending',
        payment_account_updated_at: new Date().toISOString(),
      })
      if (error) throw error
    }

    const link = await stripeRequest('account_links', {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return json(request, { url: link.url, expiresAt: link.expires_at })
  } catch (error) {
    return errorResponse(request, error, 400)
  }
})

