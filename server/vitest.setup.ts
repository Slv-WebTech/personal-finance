import 'dotenv/config'

// Tests must never touch the real dev database.
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI ?? 'mongodb://localhost:27017/personal-finance-test'
