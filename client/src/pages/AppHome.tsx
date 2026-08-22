import AppHeader from '../components/layout/AppHeader'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import styles from './AppHome.module.css'

const ROADMAP_ITEMS = [
  { name: 'Accounts', description: 'Link and track your bank, credit, and cash accounts.' },
  { name: 'Transactions', description: 'Record income, expenses, and transfers.' },
  { name: 'Budgets', description: 'Set monthly category budgets and track spend against them.' },
  { name: 'Investments', description: 'Track holdings and portfolio performance over time.' },
  { name: 'Reports', description: 'Charts and trends across your accounts and spending.' },
  { name: 'Notifications', description: 'Alerts for overspending, bills due, and account activity.' },
]

function AppHome() {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.content}>
        <Card className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>Welcome, {user?.name ?? 'there'}.</h1>
          <p className={styles.welcomeText}>
            This is your account home. The full financial dashboard — accounts, transactions,
            budgets, investments, and reports — hasn&apos;t been built yet. It&apos;s next on the
            roadmap.
          </p>
        </Card>

        <section aria-labelledby="roadmap-heading" className={styles.roadmap}>
          <h2 id="roadmap-heading" className={styles.roadmapHeading}>
            What&apos;s coming
          </h2>
          <ul className={styles.roadmapList}>
            {ROADMAP_ITEMS.map((item) => (
              <li key={item.name} className={styles.roadmapRow}>
                <div>
                  <p className={styles.roadmapName}>{item.name}</p>
                  <p className={styles.roadmapDescription}>{item.description}</p>
                </div>
                <Badge tone="neutral">Planned</Badge>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default AppHome
