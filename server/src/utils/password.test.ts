import { describe, expect, it } from 'vitest'
import { hashPassword, comparePassword } from './password.js'

describe('password hashing', () => {
  it('hashes a password and verifies the correct plaintext against it', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toBe('correct horse battery staple')
    expect(await comparePassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await comparePassword('wrong password', hash)).toBe(false)
  })
})
