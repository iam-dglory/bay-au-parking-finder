/** Bay's mark: a sky-blue parking sign with a white "P" and a hot pink dot. */
export const P_PATH = 'M30 18H57A19 19 0 0 1 57 56H45V82H30ZM45 31V43H56A6 6 0 0 0 56 31Z'

export function SignMark({ className = 'h-9 w-9', title }: { className?: string; title?: string }) {
  return <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <defs>
      <linearGradient id="bay-sign" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0369a1" /></linearGradient>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bay-sign)" />
    <rect x="9" y="9" width="82" height="82" rx="16" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="3.5" />
    <path d={P_PATH} fill="#fff" fillRule="evenodd" />
    <circle cx="74" cy="74" r="7" fill="#ff2d87" />
  </svg>
}

/** Sign mark with the "Bay" name beside it. */
export function BrandMark({ className = '', size = 'md', label = 'Bay' }: { className?: string; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = { sm: ['h-7 w-7', 'text-xl'], md: ['h-9 w-9', 'text-2xl'], lg: ['h-14 w-14', 'text-4xl'] }[size]
  return <span className={`inline-flex items-center gap-2 ${className}`} aria-label={label} role="img">
    <SignMark className={s[0]} />
    <span aria-hidden className={`${s[1]} font-black tracking-[-.04em] text-ink`}>Bay</span>
  </span>
}
