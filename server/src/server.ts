import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'

const port = process.env.PORT ?? 4000
const MIN_SECRET_LENGTH = 32

function assertJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH || secret === 'replace-with-a-real-secret') {
    throw new Error(`JWT_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters`)
  }
}

async function start() {
  assertJwtSecret()
  await connectDatabase(process.env.MONGODB_URI)
  const app = createApp()
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })

  const shutdown = () => {
    server.close(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
