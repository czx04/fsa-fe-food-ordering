import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'

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
  response.status(404).json({ message: 'Route not found' })
})

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error)
  const status = error.status || error.statusCode || 500
  const message = error.message || 'Internal server error'
  response.status(status).json({ message })
}

app.use(errorHandler)
