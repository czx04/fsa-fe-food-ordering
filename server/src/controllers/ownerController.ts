import { Response } from 'express'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import { Restaurant } from '../models/Restaurant.js'

export const getMyRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Không tìm thấy thông tin đăng nhập.' })
      return
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId, deletedAt: null })
      .populate('cuisineCategoryIds', 'name slug')
    
    res.json({ restaurant })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Lỗi hệ thống.' })
  }
}

export const onboardRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Không tìm thấy thông tin đăng nhập.' })
      return
    }

    const { name, description, phone, line1, ward, district, city, priceRange } = req.body

    if (!name || !description || !phone || !line1 || !district || !city) {
      res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc của nhà hàng.' })
      return
    }

    const existing = await Restaurant.findOne({ ownerId: req.user.userId, deletedAt: null })
    if (existing) {
      res.status(400).json({ message: 'Bạn đã đăng ký hồ sơ nhà hàng trước đó.' })
      return
    }

    // Tạo slug từ tên quán
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4)

    const newRestaurant = await Restaurant.create({
      ownerId: req.user.userId,
      name: name.trim(),
      slug,
      description: description.trim(),
      phone: phone.trim(),
      address: {
        line1: line1.trim(),
        ward: (ward || '').trim(),
        district: district.trim(),
        city: city.trim(),
      },
      delivery: {
        fee: 15000,
        minMinutes: 20,
        maxMinutes: 40,
      },
      priceRange: priceRange || 'budget',
      approvalStatus: 'pending',
      operationStatus: 'open',
    })

    res.status(201).json({
      message: 'Nộp hồ sơ mở nhà hàng thành công! Vui lòng chờ Ban Quản Trị xét duyệt.',
      restaurant: newRestaurant,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Tạo hồ sơ nhà hàng thất bại.' })
  }
}
