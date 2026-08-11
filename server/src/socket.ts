import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyAccessToken } from './utils/jwt.js'
import { User } from './models/User.js'
import { Order } from './models/Order.js'
import { env } from './config/env.js'

let io: Server

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.clientOrigins,
      methods: ['GET', 'POST'],
    },
  })

  // Middleware xác thực token
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error: Token not provided'))
    }
    try {
      const decoded = verifyAccessToken(token)
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'))
      }
      socket.data.user = await User.findById(decoded.userId).lean()
      next()
    } catch (err) {
      next(new Error('Authentication error: Token expired or invalid'))
    }
  })

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id} - User: ${socket.data.user?.email}`)

    socket.on('join:order', async (orderId: string) => {
      try {
        const order = await Order.findById(orderId).lean()
        // Chỉ cho phép khách hàng của đơn hàng hoặc chủ nhà hàng của đơn hàng tham gia
        if (order && (order.customerId.toString() === socket.data.user._id.toString() || order.restaurantId.toString() === socket.data.user.restaurantId?.toString())) {
          await socket.join(`order:${orderId}`)
          console.log(`[Socket] User ${socket.data.user.email} joined room order:${orderId}`)
        }
      } catch (error) {
        console.error(`[Socket] Error joining order room: ${error}`)
      }
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIoInstance = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!')
  }
  return io
}
