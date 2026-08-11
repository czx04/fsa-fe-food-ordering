import { Request, Response } from 'express'
import * as authService from '../services/authService.js'
import { AuthRequest } from '../middlewares/authMiddleware.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
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

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    const tokens = await authService.refreshSession(refreshToken)
    res.json(tokens)
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Không thể làm mới phiên đăng nhập.' })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    await authService.logoutSession(req.body.refreshToken)
    res.json({ message: 'Đăng xuất thành công.' })
  } catch {
    res.json({ message: 'Đăng xuất thành công.' })
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, role } = req.body

    const result = await authService.registerUser({
      fullName,
      email,
      phone,
      password,
      role,
    })

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      previewUrl: result.previewUrl,
      verificationLink: result.verificationLink,
    })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Đăng ký thất bại.' })
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || req.body.token
    const result = await authService.verifyEmailToken(token)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Xác thực email thất bại.' })
  }
}

export const resendVerificationEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Không tìm thấy thông tin xác thực.' })
      return
    }
    const result = await authService.resendVerificationEmail(req.user.userId)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Gửi lại email xác thực thất bại.' })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const result = await authService.requestPasswordReset(email)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Yêu cầu quên mật khẩu thất bại.' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body
    const result = await authService.resetPasswordWithToken(email, token, newPassword)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Đặt lại mật khẩu thất bại.' })
  }
}

