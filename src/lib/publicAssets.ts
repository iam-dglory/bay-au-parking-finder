/**
 * Returns a runtime asset URL. Local and Capacitor builds use Vite's public
 * base path. AWS staging/production can use a CloudFront asset origin without
 * changing any parking-data call sites.
 */
export function publicAssetUrl(path: string): string {
  const normalized = path.replace(/^\/+/, '')
  const configuredBase = (import.meta.env.VITE_ASSET_BASE_URL as string | undefined)?.trim()
  if (configuredBase) return `${configuredBase.replace(/\/+$/, '')}/${normalized}`
  return `${import.meta.env.BASE_URL}${normalized}`
}
