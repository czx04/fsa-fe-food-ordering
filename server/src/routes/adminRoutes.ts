import { Router } from 'express'
import { getPendingRestaurants, approveRestaurant } from '../controllers/adminController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

export const adminRouter = Router()

adminRouter.use(verifyToken)
adminRouter.use(requireRole(['admin']))

adminRouter.get('/restaurants', getPendingRestaurants)
adminRouter.patch('/restaurants/:id/approve', approveRestaurant)
