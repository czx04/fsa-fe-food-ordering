import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import createError from 'http-errors'

import { env } from './config/env.js'

import { authRouter } from './routes/authRoutes.js'
import publicRouter from './routes/publicRoutes.js'
import cartRouter from './routes/cartRoutes.js'
import orderRouter from './routes/orderRoutes.js'
import userRouter from './routes/userRoutes.js'
import { ownerRouter } from './routes/ownerRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import paymentRouter from './routes/paymentRoutes.js'

export const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin }))

// Serve static files from the 'public' directory
app.use(express.static('public'))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/public', publicRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', orderRouter)
app.use('/api/users', userRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/admin', adminRouter)
app.use('/api/payments', paymentRouter)

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use((_request, response) => {
  response.status(404).json({ message: 'API Route not found' })
})

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error)

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Dữ liệu đầu vào không hợp lệ.',
      errors: error.format(),
    })
  }

  if (createError.isHttpError(error)) {
    return response.status(error.statusCode).json({ message: error.message })
  }

  // Handle Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return response.status(409).json({ message: 'Dữ liệu bị trùng lặp. Vui lòng kiểm tra lại thông tin.' })
  }

  // Handle Mongoose validation error
  if (error.name === 'ValidationError') {
    return response.status(400).json({ message: error.message })
  }

  const status = error.status || error.statusCode || 500
  const message = error.message || 'Đã có lỗi xảy ra ở máy chủ.'
  response.status(status).json({ message })
}

app.use(errorHandler)
