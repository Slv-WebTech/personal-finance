import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types/auth'
import { fetchCurrentUser, loginUser, registerUser } from '../services/authService'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // 'loading' (not a boolean) lets a route guard tell "haven't checked the
  // existing token yet" apart from "checked, and there's no session" —
  // otherwise an already-logged-in user would flash the login page on reload.
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatus('unauthenticated')
      return
    }

    let cancelled = false
    fetchCurrentUser()
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('token')
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await loginUser({ email, password })
    localStorage.setItem('token', token)
    setUser(loggedInUser)
    setStatus('authenticated')
  }

  async function register(name: string, email: string, password: string) {
    const { token, user: registeredUser } = await registerUser({ name, email, password })
    localStorage.setItem('token', token)
    setUser(registeredUser)
    setStatus('authenticated')
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
