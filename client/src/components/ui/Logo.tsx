interface LogoProps {
  size?: number
  wordmark?: boolean
  className?: string
}

function Logo({ size = 28, wordmark = true, className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
    >
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="tb-logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6E8BFF" />
            <stop offset="1" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="30" fill="url(#tb-logo-bg)" />
        <path d="M30 70 L10 52 L16 80 Z" fill="#fff" />
        <ellipse cx="60" cy="74" rx="31" ry="25" fill="#fff" />
        <circle cx="88" cy="52" r="15" fill="#fff" />
        <path d="M101 49 L118 56 L101 61 Z" fill="#FFD166" />
        <circle cx="92" cy="49" r="2.8" fill="#111626" />
        <g stroke="#4F63E0" strokeWidth="4.5" strokeLinecap="round">
          <path d="M45 64v22" />
          <path d="M54 64v22" />
          <path d="M63 64v22" />
          <path d="M72 64v22" />
        </g>
        <path d="M40 84 L77 64" stroke="#0E9F8E" strokeWidth="4.5" strokeLinecap="round" />
        <g stroke="#FFD166" strokeWidth="3.5" strokeLinecap="round">
          <path d="M55 98v10" />
          <path d="M68 98v10" />
        </g>
      </svg>
      {wordmark && (
        <span
          style={{
            font: 'var(--text-h3)',
            letterSpacing: 'var(--tracking-tighter)',
            color: 'var(--color-text-primary)',
          }}
        >
          Tallybird
        </span>
      )}
    </span>
  )
}

export default Logo
