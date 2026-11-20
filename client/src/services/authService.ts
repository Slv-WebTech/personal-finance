import { api } from './api'
import { toApiError } from './httpError'
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '../types/auth'

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  } catch (err) {
    throw toApiError(err)
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  } catch (err) {
    throw toApiError(err)
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me')
    return data.user
  } catch (err) {
    throw toApiError(err)
  }
}
