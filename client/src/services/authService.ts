import axios from 'axios'
import { api } from './api'
import {
  ApiError,
  type ApiFieldError,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../types/auth'

interface RawFieldIssue {
  path: Array<string | number>
  message: string
}

function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0
    const message: string =
      err.response?.data?.error?.message ?? 'Something went wrong. Please try again.'
    const details = err.response?.data?.error?.details
    const fieldErrors: ApiFieldError[] = Array.isArray(details)
      ? details.map((issue: RawFieldIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      : []
    return new ApiError(message, status, fieldErrors)
  }
  return new ApiError('Something went wrong. Please try again.', 0)
}

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
