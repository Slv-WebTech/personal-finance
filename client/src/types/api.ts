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
