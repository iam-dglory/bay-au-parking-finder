import { useEffect, useState } from 'react'
import { signedSignPhotoUrl } from './photos'

/** Resolves a stored sign-photo URL to one the viewer is allowed to load. */
export function useSignPhoto(url: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setSrc(null)
    if (url) void signedSignPhotoUrl(url).then(signed => { if (alive) setSrc(signed) })
    return () => { alive = false }
  }, [url])
  return src
}
