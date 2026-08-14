import mongoose from 'mongoose'

export async function connectDatabase(uri: string | undefined): Promise<void> {
  if (!uri) {
    console.warn('MONGODB_URI not set — skipping database connection. Set it in server/.env to connect.')
    return
  }

  try {
    await mongoose.connect(uri)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
  }
}
