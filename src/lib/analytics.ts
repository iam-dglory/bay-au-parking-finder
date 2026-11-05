import { supabase } from './supabaseClient'

export type AnalyticsEventName =
  | 'first_open'
  | 'parking_search'
  | 'parking_result_view'
  | 'directions_open'
  | 'restriction_view'
  | 'marketplace_view'
  | 'listing_started'
  | 'listing_submitted'
  | 'booking_started'
  | 'feedback_submitted'

type SafeProperties = Record<string, string | number | boolean | null>

/**
 * Privacy-minimised, fire-and-forget first-party analytics. Do not pass exact
 * coordinates, addresses, access instructions, emails or payment data.
 */
export function trackEvent(eventName: AnalyticsEventName, properties: SafeProperties = {}) {
  void supabase.rpc('record_analytics_event', {
    p_event_name: eventName,
    p_properties: properties,
  }).then()
}

export function trackFirstOpen() {
  const key = 'bay:first-open-recorded'
  if (localStorage.getItem(key)) return
  localStorage.setItem(key, new Date().toISOString())
  trackEvent('first_open', { platform: 'webview' })
}
