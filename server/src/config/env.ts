import 'dotenv/config'

const port = Number(process.env.PORT ?? 3000)
const mongodbUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const mongodbDbName = process.env.MONGODB_DB_NAME ?? 'food_ordering'

if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
  throw new Error('PORT must be a valid integer between 1 and 65535')
}

if (!mongodbUri.startsWith('mongodb://') && !mongodbUri.startsWith('mongodb+srv://')) {
  throw new Error('MONGODB_URI must be a valid MongoDB connection string')
}

if (!mongodbDbName.trim()) {
  throw new Error('MONGODB_DB_NAME cannot be empty')
}

export const env = {
  port,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri,
  mongodbDbName,
} as const
