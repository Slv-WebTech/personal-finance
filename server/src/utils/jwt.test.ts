import { describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './jwt.js'

describe('jwt', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ sub: 'user-id-123', role: 'customer' })
    const payload = verifyToken(token)
    expect(payload.sub).toBe('user-id-123')
    expect(payload.role).toBe('customer')
  })

  it('throws on an invalid token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow()
  })
})
