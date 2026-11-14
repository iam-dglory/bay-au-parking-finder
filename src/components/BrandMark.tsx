import markUrl from '../assets/brand/bay-mark-blue.svg'
import lockupUrl from '../assets/brand/bay-lockup-primary.png'

export function SignMark({ className = 'h-9 w-9', title }: { className?: string; title?: string }) {
  return <img src={markUrl} className={`${className} object-contain`} alt={title ?? ''} aria-hidden={title ? undefined : true} />
}

/** Official BAY lockup. Never rebuild or recolour the wordmark in CSS. */
export function BrandMark({ className = '', size = 'md', label = 'Bay' }: { className?: string; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const height = { sm: 'h-7', md: 'h-9', lg: 'h-14' }[size]
  return <img src={lockupUrl} className={`${height} w-auto object-contain ${className}`} alt={label} />
}
