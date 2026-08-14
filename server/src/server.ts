import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDatabase } from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRoutes from './routes/health.routes.js'

const app = express()
const port = process.env.PORT ?? 4000

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/health', healthRoutes)

app.use(errorHandler)

async function start() {
  await connectDatabase(process.env.MONGODB_URI)
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}

start()
