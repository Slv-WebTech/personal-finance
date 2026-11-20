import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cx } from '../../utils/cx'
import AppHeader from './AppHeader'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { label: 'Home', to: '/app' },
  { label: 'Accounts', to: '/accounts' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Budgets', to: '/budgets' },
  { label: 'Investments', to: '/investments' },
]

interface AppShellProps {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.page}>
      <AppHeader />
      <nav className={styles.nav} aria-label="Main">
        <div className={styles.navInner}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cx(styles.navLink, isActive && styles.navLinkActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

export default AppShell
