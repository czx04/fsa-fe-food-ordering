import { Router } from 'express'
import {
  getCategories,
  getMenuItems,
  getRestaurantDetail,
  getRestaurantMenuCategories,
  getRestaurantMenuItemDetail,
  getRestaurantMenuItems,
  getRestaurantReviews,
  getRestaurants,
  getPromotions,
} from '../controllers/publicController.js'

const router = Router()

router.get('/categories', getCategories)
router.get('/promotions', getPromotions)
router.get('/restaurants', getRestaurants)
router.get('/restaurants/:restaurantSlug/menu-categories', getRestaurantMenuCategories)
router.get('/restaurants/:restaurantSlug/menu-items', getRestaurantMenuItems)
router.get('/restaurants/:restaurantSlug/menu-items/:itemSlug', getRestaurantMenuItemDetail)
router.get('/restaurants/:restaurantSlug/reviews', getRestaurantReviews)
router.get('/restaurants/:restaurantSlug', getRestaurantDetail)
router.get('/menu-items', getMenuItems)

export default router
