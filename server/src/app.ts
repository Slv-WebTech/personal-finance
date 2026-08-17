import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  app.use(express.json())

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)

  app.use(errorHandler)

  return app
}
