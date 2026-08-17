import jwt from 'jsonwebtoken'

const TOKEN_EXPIRY = '7d'

export interface TokenPayload {
  sub: string
  role: 'customer' | 'advisor' | 'admin'
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return secret
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload
}
