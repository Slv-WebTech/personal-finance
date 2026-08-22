export type UserRole = 'customer' | 'advisor' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ApiFieldError {
  path: string
  message: string
}

export class ApiError extends Error {
  status: number
  fieldErrors: ApiFieldError[]

  constructor(message: string, status: number, fieldErrors: ApiFieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}
