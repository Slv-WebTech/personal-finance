import { Link } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { cx } from '../utils/cx'
import styles from './Landing.module.css'

interface Feature {
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: 'Accounts',
    description:
      'Add every checking, savings, or credit account you hold and see them side by side, instead of piecing your balances together from memory.',
  },
  {
    title: 'Transactions & spending',
    description:
      'Record income and expenses as they happen so every dollar is categorized and accounted for, with no missing receipts and no guesswork.',
  },
  {
    title: 'Budgets',
    description:
      'Set a monthly limit for each spending category and track how close you are to it before the month gets away from you.',
  },
  {
    title: 'Investments',
    description:
      'Log your holdings alongside your everyday accounts so your net worth reflects your whole financial picture, not just your checking balance.',
  },
  {
    title: 'Reports & insights',
    description:
      'Turn months of entries into readable trends: spending by category, income versus expenses, and how your net worth moves over time.',
  },
]

function Landing() {
  return (
    <>
      <header className={styles.header}>
        <div className={cx(styles.container, styles.headerInner)}>
          <Logo size={28} wordmark />
          <nav className={styles.nav} aria-label="Account">
            <Link to="/login" className={styles.navLink}>
              Log in
            </Link>
            <Link to="/register" className={cx(styles.btn, styles.btnPrimary, styles.btnSm)}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={cx(styles.container, styles.heroInner)}>
            <h1 className={styles.heroTitle}>
              Your accounts, spending, budgets, and investments — finally in one place.
            </h1>
            <p className={styles.heroSubtitle}>
              Personal Finance Dashboard is a manual-entry tracker: you add your accounts and
              transactions yourself, and it turns them into a clear, organized view of your
              finances. No bank connections, no automatic syncing — just accurate numbers you
              control.
            </p>
            <div className={styles.heroActions}>
              <Link to="/register" className={cx(styles.btn, styles.btnPrimary, styles.btnLg)}>
                Get started
              </Link>
              <Link to="/login" className={cx(styles.btn, styles.btnGhost, styles.btnLg)}>
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <Badge tone="neutral">Product roadmap</Badge>
              <h2 id="features-heading" className={styles.sectionTitle}>
                What Personal Finance Dashboard is for
              </h2>
              <p className={styles.sectionSubtitle}>
                Registration and sign-in are live today. The dashboard below is what we&apos;re
                building next — everything you need to see and manage your money in one place.
              </p>
            </div>
            <div className={styles.featureGrid}>
              {features.map((feature) => (
                <Card key={feature.title} padding="lg" className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={cx(styles.container, styles.ctaInner)}>
            <h2 className={styles.ctaTitle}>Start tracking your finances today.</h2>
            <p className={styles.ctaSubtitle}>
              Create a free account in a couple of minutes and start building a complete picture
              of your money.
            </p>
            <div className={styles.ctaActions}>
              <Link to="/register" className={cx(styles.btn, styles.btnPrimary, styles.btnLg)}>
                Get started
              </Link>
              <Link to="/login" className={styles.navLink}>
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={cx(styles.container, styles.footerInner)}>
          <Logo size={20} wordmark className={styles.footerLogo} />
          <p className={styles.footerText}>
            Personal Finance Dashboard is a portfolio project, built with React, TypeScript, and
            MongoDB.
          </p>
        </div>
      </footer>
    </>
  )
}

export default Landing
