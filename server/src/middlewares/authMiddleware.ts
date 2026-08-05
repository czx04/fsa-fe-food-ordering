import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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

  req.user = decoded
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
