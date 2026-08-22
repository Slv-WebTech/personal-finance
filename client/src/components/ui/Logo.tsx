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
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="var(--color-accent)" />
        <path d="M13 30V24" stroke="var(--color-text-inverse)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M20.5 30V18" stroke="var(--color-text-inverse)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M28 30V21" stroke="var(--color-text-inverse)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M35 30V14" stroke="var(--color-text-inverse)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      {wordmark && (
        <span
          style={{
            font: 'var(--text-h3)',
            letterSpacing: 'var(--tracking-tighter)',
            color: 'var(--color-text-primary)',
          }}
        >
          Finance Dashboard
        </span>
      )}
    </span>
  )
}

export default Logo
