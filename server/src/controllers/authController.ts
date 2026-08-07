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

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, role } = req.body

    if (!fullName || !email || !phone || !password) {
      res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên, Email, SĐT và Mật khẩu.' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
      return
    }

    const newUser = await authService.registerUser({
      fullName,
      email,
      phone,
      password,
      role,
    })

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      user: newUser,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Đăng ký thất bại.' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ message: 'Vui lòng nhập địa chỉ email.' })
      return
    }

    const result = await authService.requestPasswordReset(email)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Yêu cầu quên mật khẩu thất bại.' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body
    if (!email || !token || !newPassword) {
      res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ: email, mã xác thực và mật khẩu mới.' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
      return
    }

    const result = await authService.resetPasswordWithToken(email, token, newPassword)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Đặt lại mật khẩu thất bại.' })
  }
}


