import { Request, Response } from 'express'
import { MenuItem } from '../models/MenuItem.js'
import {
  listCuisineCategories,
  listPublicRestaurants,
  parseRestaurantQuery,
  PublicRestaurantQueryError,
} from '../services/publicRestaurantService.js'

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await listCuisineCategories()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' })
  }
}

export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseRestaurantQuery(req.query)
    const result = await listPublicRestaurants(query)
    res.json(result)
  } catch (error) {
    if (error instanceof PublicRestaurantQueryError) {
      res.status(400).json({ message: error.message, errors: error.errors })
      return
    }
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà hàng' })
  }
}

export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 8
    const menuItems = await MenuItem.find({ isAvailable: true })
      .populate('restaurantId', 'name')
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit)

    res.json(menuItems)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách món ăn' })
  }
}
