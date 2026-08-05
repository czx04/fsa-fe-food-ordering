import bcrypt from 'bcryptjs'
import { User, IUser } from '../models/User.js'
import { generateTokens } from '../utils/jwt.js'

export const loginUser = async (email: string, passwordRaw: string) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác.')
  }

  if (user.status === 'locked') {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error(`Tài khoản đang bị khóa đến ${user.lockedUntil.toLocaleString()}`)
    } else if (user.lockedUntil && user.lockedUntil <= new Date()) {
      // Un-lock if time passed
      user.status = 'active'
      user.lockedUntil = null
      user.failedLoginCount = 0
      await user.save()
    } else {
      throw new Error('Tài khoản đã bị khóa.')
    }
  }

  const isMatch = await bcrypt.compare(passwordRaw, user.passwordHash)
  if (!isMatch) {
    user.failedLoginCount += 1
    if (user.failedLoginCount >= 5) {
      user.status = 'locked'
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 mins
      await user.save()
      throw new Error('Đăng nhập sai quá nhiều lần. Tài khoản bị khóa 15 phút.')
    }
    await user.save()
    throw new Error('Email hoặc mật khẩu không chính xác.')
  }

  // Success login
  user.failedLoginCount = 0
  user.lockedUntil = null
  user.lastLoginAt = new Date()

  const { accessToken, refreshToken } = generateTokens(user)
  
  // Store refresh token
  user.refreshTokens.push(refreshToken)
  await user.save()

  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  }
}

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash -refreshTokens')
  if (!user) throw new Error('Người dùng không tồn tại.')
  return user
}
