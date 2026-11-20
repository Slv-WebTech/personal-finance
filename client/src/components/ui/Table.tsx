import type { TableHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'
import styles from './Table.module.css'

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  className?: string
}

function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={cx(styles.table, className)} {...rest}>
        {children}
      </table>
    </div>
  )
}

export default Table
