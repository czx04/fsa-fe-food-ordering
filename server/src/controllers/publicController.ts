import { Request, Response } from 'express'
import { CuisineCategory } from '../models/CuisineCategory.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CuisineCategory.find({ isActive: true }).sort({ displayOrder: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' })
  }
}

export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number.parseInt(req.query.limit as string) || 6
    const restaurants = await Restaurant.find({ isActive: true })
      .populate('cuisineCategoryIds', 'name slug')
      .sort({ rating: -1 })
      .limit(limit)

    res.json(restaurants)
  } catch (error) {
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
