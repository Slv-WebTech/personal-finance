import axios from 'axios'
import { ApiError, type ApiFieldError } from '../types/api'

interface RawFieldIssue {
  path: Array<string | number>
  message: string
}

export function toApiError(err: unknown): ApiError {
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
