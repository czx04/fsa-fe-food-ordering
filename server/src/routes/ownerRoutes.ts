import { Router } from 'express'
import { getMyRestaurant, onboardRestaurant } from '../controllers/ownerController.js'
import { verifyToken, requireRole, requireVerifiedEmail } from '../middlewares/authMiddleware.js'

export const ownerRouter = Router()

ownerRouter.use(verifyToken)
ownerRouter.use(requireRole(['restaurant_owner']))

ownerRouter.get('/restaurant', getMyRestaurant)
ownerRouter.post('/restaurant', requireVerifiedEmail, onboardRestaurant)

