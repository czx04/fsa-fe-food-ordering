import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'

import { env } from './config/env.js'

import { authRouter } from './routes/authRoutes.js'
import publicRouter from './routes/publicRoutes.js'

export const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/public', publicRouter)

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
  response.status(500).json({ message: 'Internal server error' })
}

app.use(errorHandler)
