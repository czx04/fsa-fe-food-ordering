import { Router } from 'express'
import { z } from 'zod'
import * as authController from '../controllers/authController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/authValidator.js'

export const authRouter = Router()

authRouter.post('/login', validate(loginSchema), authController.login)
authRouter.post('/refresh', validate({ body: z.object({ refreshToken: z.string().min(1) }) }), authController.refresh)
authRouter.post('/logout', validate({ body: z.object({ refreshToken: z.string().min(1) }) }), authController.logout)
authRouter.post('/register', validate(registerSchema), authController.register)
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword)
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)
authRouter.get('/verify-email', validate({ query: verifyEmailSchema }), authController.verifyEmail)
authRouter.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail)
authRouter.get('/me', verifyToken, authController.getMe)

