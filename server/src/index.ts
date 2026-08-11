//import dns from 'node:dns'
import { app } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { initSocketServer } from './socket.js'
import { autoCancelExpiredVnpayOrders } from './services/orderService.js'

//dns.setServers(['1.1.1.1', '8.8.8.8'])

let server: ReturnType<typeof app.listen> | undefined
let isShuttingDown = false
let cleanupTimer: NodeJS.Timeout | undefined

const startVnpayTimeoutCleanup = () => {
  const run = async () => {
    try {
      const count = await autoCancelExpiredVnpayOrders(
        env.vnpayPaymentTimeoutMinutes,
      )
      if (count > 0) {
        console.log(
          `🔁 Đã tự động hủy ${count} đơn hàng VNPAY chưa hoàn tất thanh toán.`,
        )
      }
    } catch (error) {
      console.error('❌ Lỗi khi tự động hủy đơn hàng VNPAY quá hạn:', error)
    }
  }

  // Chạy ngay khi khởi động để dọn các đơn kẹt còn sót lại, sau đó lặp định kỳ.
  void run()
  cleanupTimer = setInterval(
    run,
    env.vnpayPaymentTimeoutMinutes * 60 * 1000,
  )
}

const start = async () => {
  await connectDatabase()

  server = app.listen(env.port, () => {
    initSocketServer(server!)
    console.log(`API ready at http://localhost:${env.port}`)
  })
  startVnpayTimeoutCleanup()
}

const closeServer = () =>
  new Promise<void>((resolve, reject) => {
    if (!server || !server.listening) {
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
    if (cleanupTimer) clearInterval(cleanupTimer)
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
