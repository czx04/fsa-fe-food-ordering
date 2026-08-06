import { Request, Response } from 'express'
import * as authService from '../services/authService.js'
import { AuthRequest } from '../middlewares/authMiddleware.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' })
      return
    }

    const result = await authService.loginUser(email, password)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Đăng nhập thất bại.' })
  }
}

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Không tìm thấy thông tin xác thực.' })
      return
    }
    const user = await authService.getMe(req.user.userId)
    res.json({ user })
  } catch (error: any) {
    res.status(404).json({ message: error.message })
  }
}
