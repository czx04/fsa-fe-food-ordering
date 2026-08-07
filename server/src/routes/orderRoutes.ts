import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { getOrderDetailHandler, getOrderHistoryHandler } from '../controllers/orderController.js'

const router = Router()

router.use(verifyToken)

router.route('/')
    .get(getOrderHistoryHandler)

router.route('/:id')
    .get(getOrderDetailHandler)

export default router
