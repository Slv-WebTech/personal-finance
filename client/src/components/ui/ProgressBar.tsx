import { cx } from '../../utils/cx'
import styles from './ProgressBar.module.css'

type ProgressTone = 'accent' | 'success' | 'warning' | 'danger'

interface ProgressBarProps {
  value: number
  tone?: ProgressTone
  label?: string
  className?: string
}

function ProgressBar({ value, tone = 'accent', label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cx(styles.track, className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cx(styles.fill, styles[tone])} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export default ProgressBar
