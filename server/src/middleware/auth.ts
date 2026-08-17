import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type TokenPayload } from '../utils/jwt.js'

// Augmenting Express's ambient Request type requires the `namespace` form —
// there is no ES module equivalent for extending a third-party global namespace.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Missing or invalid Authorization header' } })
    return
  }

  try {
    req.auth = verifyToken(header.slice('Bearer '.length))
    next()
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token' } })
  }
}

export function requireRole(...roles: TokenPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: { message: 'Forbidden' } })
      return
    }
    next()
  }
}
