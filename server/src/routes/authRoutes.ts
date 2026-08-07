import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

export const authRouter = Router()

authRouter.post('/login', authController.login)
authRouter.post('/register', authController.register)
authRouter.post('/forgot-password', authController.forgotPassword)
authRouter.post('/reset-password', authController.resetPassword)
authRouter.get('/me', verifyToken, authController.getMe)


