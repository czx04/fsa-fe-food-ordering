import { Request, Response } from 'express'
import { MenuItem } from '../models/MenuItem.js'
import {
  listCuisineCategories,
  listPublicRestaurants,
  parseRestaurantQuery,
  PublicRestaurantQueryError,
} from '../services/publicRestaurantService.js'
import {
  getPublicRestaurantDetail,
  getPublicMenuItemDetail,
  listPublicMenuCategories,
  listPublicMenuItems,
  listPublicReviews,
  parseMenuItemQuery,
  parseReviewQuery,
  PublicDetailQueryError,
  PublicResourceNotFoundError,
} from '../services/publicRestaurantDetailService.js'

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
    const parsedLimit = Number(req.query.limit ?? 8)
    const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 20 ? parsedLimit : 8
    const menuItems = await MenuItem.find({
      isAvailable: true,
      isVisible: { $ne: false },
      deletedAt: null,
    })
      .populate({
        path: 'restaurantId',
        match: { approvalStatus: 'approved', operationStatus: { $ne: 'suspended' }, deletedAt: null },
        select: 'name slug',
      })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit * 2)
      .lean()

    const slugify = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    const data = menuItems
      .filter((item) => item.restaurantId)
      .slice(0, limit)
      .map((item) => {
        const restaurant = item.restaurantId as unknown as {
          _id: { toString(): string }
          name: string
          slug: string
        }
        const basePrice = item.basePrice ?? item.price ?? 0
        return {
          _id: item._id.toString(),
          name: item.name,
          slug: item.slug ?? slugify(item.name),
          description: item.shortDescription ?? item.description ?? '',
          price: item.salePrice ?? basePrice,
          imageUrl: item.imageUrls?.[0] ?? item.imageUrl ?? null,
          isAvailable: item.isAvailable,
          restaurantId: {
            _id: restaurant._id.toString(),
            name: restaurant.name,
            slug: restaurant.slug,
          },
        }
      })

    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách món ăn' })
  }
}

const handlePublicDetailError = (error: unknown, res: Response, fallbackMessage: string) => {
  if (error instanceof PublicResourceNotFoundError) {
    res.status(404).json({ message: error.message })
    return
  }
  if (error instanceof PublicDetailQueryError) {
    res.status(400).json({ message: error.message, errors: error.errors })
    return
  }
  console.error(error)
  res.status(500).json({ message: fallbackMessage })
}

const restaurantSlug = (req: Request) => {
  const value = req.params.restaurantSlug
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export const getRestaurantDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await getPublicRestaurantDetail(restaurantSlug(req)))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy chi tiết nhà hàng')
  }
}

export const getRestaurantMenuCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.json(await listPublicMenuCategories(restaurantSlug(req)))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy danh mục thực đơn')
  }
}

export const getRestaurantMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseMenuItemQuery(req.query)
    res.json(await listPublicMenuItems(restaurantSlug(req), query))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy thực đơn')
  }
}

export const getRestaurantReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseReviewQuery(req.query)
    res.json(await listPublicReviews(restaurantSlug(req), query))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy đánh giá')
  }
}

export const getRestaurantMenuItemDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemSlugValue = req.params.itemSlug
    const itemSlug = Array.isArray(itemSlugValue) ? (itemSlugValue[0] ?? '') : (itemSlugValue ?? '')
    res.json(await getPublicMenuItemDetail(restaurantSlug(req), itemSlug))
  } catch (error) {
    handlePublicDetailError(error, res, 'Lỗi server khi lấy chi tiết món ăn')
  }
}
