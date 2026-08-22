import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import styles from './AppHeader.module.css'

function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <Logo size={24} />
      <div className={styles.actions}>
        {user && <span className={styles.userName}>{user.name}</span>}
        <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  )
}

export default AppHeader
