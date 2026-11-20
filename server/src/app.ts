import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import accountsRoutes from './routes/accounts.routes.js'
import transactionsRoutes from './routes/transactions.routes.js'
import budgetsRoutes from './routes/budgets.routes.js'
import investmentsRoutes from './routes/investments.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  app.use(helmet())
  app.use(express.json({ limit: '100kb' }))

  // Brute-force protection for credential endpoints. Skipped under Vitest, where
  // many users register from one IP within seconds.
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      ['/api/auth/login', '/api/auth/register'],
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: { message: 'Too many attempts, please try again later' } },
      }),
    )
  }

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/accounts', accountsRoutes)
  app.use('/api/transactions', transactionsRoutes)
  app.use('/api/budgets', budgetsRoutes)
  app.use('/api/investments', investmentsRoutes)
  app.use('/api/dashboard', dashboardRoutes)

  app.use(errorHandler)

  return app
}
