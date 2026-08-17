import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'

const port = process.env.PORT ?? 4000

async function start() {
  await connectDatabase(process.env.MONGODB_URI)
  const app = createApp()
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
}

start()
