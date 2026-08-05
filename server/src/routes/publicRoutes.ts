import { Router } from 'express'
import { getCategories, getRestaurants, getMenuItems } from '../controllers/publicController.js'

const router = Router()

router.get('/categories', getCategories)
router.get('/restaurants', getRestaurants)
router.get('/menu-items', getMenuItems)

export default router
