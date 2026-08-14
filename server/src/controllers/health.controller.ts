import type { Request, Response } from 'express'
import mongoose from 'mongoose'

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  })
}
