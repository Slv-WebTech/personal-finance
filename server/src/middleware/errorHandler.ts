import type { NextFunction, Request, Response } from 'express'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err)

  // Body-parser errors (malformed JSON, payload too large) carry a client-safe status.
  const status = (err as { status?: unknown })?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: { message: status === 413 ? 'Payload too large' : 'Bad request' } })
    return
  }

  // Never leak internal error details to clients.
  res.status(500).json({ error: { message: 'Internal server error' } })
}
