import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

export const authRouter = Router()

authRouter.post('/login', authController.login)
authRouter.get('/me', verifyToken, authController.getMe)
