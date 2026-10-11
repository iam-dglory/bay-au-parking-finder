import { WORDMARK_URL } from '../lib/assets'

export function BrandMark({ className = 'w-24', label = 'Bay' }: { className?: string; label?: string }) {
  return <img src={WORDMARK_URL} alt={label} className={`h-auto object-contain ${className}`} />
}
