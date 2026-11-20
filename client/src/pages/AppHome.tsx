import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { getDashboardSummary } from '../services/dashboardService'
import type { DashboardSummary } from '../types/dashboard'
import styles from './AppHome.module.css'

function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

const ROADMAP_ITEMS = [
  { name: 'Accounts', description: 'Link and track your bank, credit, and cash accounts.', to: '/accounts' },
  { name: 'Transactions', description: 'Record income, expenses, and transfers.', to: '/transactions' },
  { name: 'Budgets', description: 'Set monthly category budgets and track spend against them.', to: '/budgets' },
  { name: 'Investments', description: 'Track holdings and portfolio performance over time.', to: '/investments' },
  { name: 'Reports', description: 'Charts and trends across your accounts and spending.' },
  { name: 'Notifications', description: 'Alerts for overspending, bills due, and account activity.' },
]

function AppHome() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  return (
    <AppShell>
      <div className={styles.content}>
        <Card className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>Welcome, {user?.name ?? 'there'}.</h1>
          <p className={styles.welcomeText}>
            This is your account home. Reports and notifications haven&apos;t been built yet. Accounts, transactions, budgets, and investments are live, though.
          </p>
        </Card>

        {summary && (
          <Card>
            <h2 className={styles.roadmapHeading}>Your snapshot</h2>
            <ul className={styles.roadmapList}>
              {summary.balances.map((b) => (
                <li key={b.currency} className={styles.roadmapRow}>
                  <p className={styles.roadmapName}>Balance ({b.currency}, {b.accounts} accounts)</p>
                  <p>{money(b.total, b.currency)}</p>
                </li>
              ))}
              <li className={styles.roadmapRow}>
                <p className={styles.roadmapName}>This month: income / expenses</p>
                <p>
                  {money(summary.thisMonth.income)} / {money(summary.thisMonth.expense)}
                </p>
              </li>
              <li className={styles.roadmapRow}>
                <p className={styles.roadmapName}>Investments ({summary.investments.holdings} holdings)</p>
                <p>{money(summary.investments.currentValue)}</p>
              </li>
            </ul>
          </Card>
        )}

        <section aria-labelledby="roadmap-heading" className={styles.roadmap}>
          <h2 id="roadmap-heading" className={styles.roadmapHeading}>
            What&apos;s coming
          </h2>
          <ul className={styles.roadmapList}>
            {ROADMAP_ITEMS.map((item) => (
              <li key={item.name} className={styles.roadmapRow}>
                <div>
                  <p className={styles.roadmapName}>
                    {item.to ? <Link to={item.to}>{item.name}</Link> : item.name}
                  </p>
                  <p className={styles.roadmapDescription}>{item.description}</p>
                </div>
                <Badge tone={item.to ? 'success' : 'neutral'}>{item.to ? 'Available' : 'Planned'}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}

export default AppHome
