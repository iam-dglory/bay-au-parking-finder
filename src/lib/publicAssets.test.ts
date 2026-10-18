import { describe, expect, it, vi } from 'vitest'

describe('publicAssetUrl', () => {
  it('uses the Vite public base when no CDN is configured', async () => {
    vi.stubEnv('VITE_ASSET_BASE_URL', '')
    vi.resetModules()
    const { publicAssetUrl } = await import('./publicAssets')
    expect(publicAssetUrl('/data/india/index.json')).toContain('data/india/index.json')
  })

  it('uses a configured CloudFront origin for runtime datasets', async () => {
    vi.stubEnv('VITE_ASSET_BASE_URL', 'https://assets.example.test/')
    vi.resetModules()
    const { publicAssetUrl } = await import('./publicAssets')
    expect(publicAssetUrl('/data/usa/index.json')).toBe('https://assets.example.test/data/usa/index.json')
  })
})
