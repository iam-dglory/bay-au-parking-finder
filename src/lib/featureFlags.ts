function envFlag(value: unknown) {
  return String(value ?? '').toLowerCase() === 'true'
}

/**
 * Marketplace V2 must remain opt-in until the production release gate has
 * been verified (zones, moderation, Connect, webhooks, refunds and monitoring).
 * A URL override keeps the internal preview accessible without exposing it in
 * a normal public build.
 */
export function marketplaceV2Enabled() {
  const preview = new URLSearchParams(window.location.search).get('marketplace-preview') === '1'
  return envFlag(import.meta.env.VITE_ENABLE_MARKETPLACE_V2) || preview
}
