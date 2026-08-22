import type { ReactNode } from 'react'
import Logo from '../ui/Logo'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brandPanel}>
        <Logo size={32} />
        <p className={styles.pitch}>
          Track every account, budget, and investment in one place.
        </p>
      </aside>
      <main className={styles.formSide}>
        <div className={styles.formWrap}>
          <div className={styles.header}>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
