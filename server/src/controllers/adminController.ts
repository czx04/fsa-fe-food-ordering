import { Response } from 'express'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import { Restaurant } from '../models/Restaurant.js'

export const getPendingRestaurants = async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await Restaurant.find({ deletedAt: null })
      .populate('ownerId', 'fullName email phone')
      .sort({ createdAt: -1 })

    res.json({ data: restaurants })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Lỗi lấy danh sách nhà hàng.' })
  }
}

export const approveRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { approvalStatus, rejectionReason } = req.body

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      res.status(400).json({ message: 'Trạng thái phê duyệt không hợp lệ.' })
      return
    }

    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      res.status(404).json({ message: 'Không tìm thấy nhà hàng.' })
      return
    }

    restaurant.approvalStatus = approvalStatus
    if (rejectionReason !== undefined) {
      restaurant.rejectionReason = rejectionReason
    }
    await restaurant.save()

    res.json({
      message: `Đã cập nhật trạng thái nhà hàng thành ${approvalStatus}.`,
      restaurant,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Cập nhật phê duyệt thất bại.' })
  }
}
