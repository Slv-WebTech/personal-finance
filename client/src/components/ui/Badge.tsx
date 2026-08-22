import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './Badge.module.css'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning'

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)}>{children}</span>
}

export default Badge
