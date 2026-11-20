import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
}

function Select({ label, options, error, hint, id, className, disabled, ...rest }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const descriptionId = `${selectId}-description`
  const describedBy = error || hint ? descriptionId : undefined

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.selectWrapper}>
        <select
          id={selectId}
          disabled={disabled}
          className={cx(styles.select, error && styles.selectError)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? (
        <p id={descriptionId} role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className={styles.hintText}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default Select
