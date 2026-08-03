import { app } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'

let server: ReturnType<typeof app.listen> | undefined
let isShuttingDown = false

const start = async () => {
  await connectDatabase()

  server = app.listen(env.port, () => {
    console.log(`API ready at http://localhost:${env.port}`)
  })
}

const closeServer = () =>
  new Promise<void>((resolve, reject) => {
    if (!server) {
      resolve()
      return
    }

    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`${signal} received. Shutting down...`)

  try {
    await closeServer()
    await disconnectDatabase()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

process.on('SIGINT', (signal) => void shutdown(signal))
process.on('SIGTERM', (signal) => void shutdown(signal))

start().catch(async (error: unknown) => {
  console.error('Failed to start server:', error)
  await disconnectDatabase()
  process.exit(1)
})
