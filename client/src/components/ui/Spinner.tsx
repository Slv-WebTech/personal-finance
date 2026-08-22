import { cx } from '../../utils/cx'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number
  label?: string
  className?: string
}

function Spinner({ size = 16, label, className }: SpinnerProps) {
  const svg = (
    <svg
      className={cx(styles.spinner, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )

  if (!label) {
    return svg
  }

  return (
    <span role="status" aria-live="polite" className={styles.statusWrapper}>
      {svg}
      <span className={styles.srOnly}>{label}</span>
    </span>
  )
}

export default Spinner
