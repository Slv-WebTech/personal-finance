import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import styles from './NotFound.module.css'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className={styles.wrapper}>
      <Card padding="lg" className={styles.card}>
        <span className={styles.code}>404</span>
        <h1 className={styles.heading}>This page doesn&apos;t exist</h1>
        <p className={styles.message}>
          The page you&apos;re looking for may have been moved or removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </Card>
    </div>
  )
}

export default NotFound
