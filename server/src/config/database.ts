import mongoose from 'mongoose'

import { env } from './env.js'

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
  })

  console.log(`MongoDB connected: ${env.mongodbDbName}`)
}

export const disconnectDatabase = async () => {
  await mongoose.disconnect()
}
