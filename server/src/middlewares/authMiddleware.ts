import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { User } from '../models/User.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Không tìm thấy token xác thực.' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: 'Token không hợp lệ.' })
    return
  }
  
  const decoded = verifyAccessToken(token)

  if (!decoded) {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' })
    return
  }

  try {
    const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('role status').lean()
    if (!user || user.status === 'locked') {
      res.status(401).json({ message: 'Phiên đăng nhập không còn hiệu lực.' })
      return
    }
    req.user = { userId: String(user._id), role: user.role }
    next()
  } catch (error) {
    next(error)
  }
}

export const optionalVerifyToken = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token) {
      const decoded = verifyAccessToken(token)
      if (decoded) {
        try {
          const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('role status').lean()
          if (user && user.status !== 'locked') {
            req.user = { userId: String(user._id), role: user.role }
          }
        } catch {
          // Ignore error in optional middleware
        }
      }
    }
  }
  next()
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Chưa xác thực.' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Không có quyền truy cập.' })
      return
    }

    next()
  }
}

export const requireVerifiedEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: 'Chưa xác thực.' })
    return
  }

  const { User } = await import('../models/User.js')
  const user = await User.findById(req.user.userId).select('status')
  if (!user || user.status === 'pending_verification') {
    res.status(403).json({
      message: 'Tài khoản chưa được xác thực email. Vui lòng kiểm tra email để kích hoạt đầy đủ tính năng.',
    })
    return
  }

  next()
}
