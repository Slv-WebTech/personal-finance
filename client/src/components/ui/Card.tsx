import type { HTMLAttributes } from 'react'
import { cx } from '../../utils/cx'
import styles from './Card.module.css'

type CardPadding = 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
}

function Card({ padding = 'lg', className, children, ...rest }: CardProps) {
  return (
    <div className={cx(styles.card, styles[padding], className)} {...rest}>
      {children}
    </div>
  )
}

export default Card
