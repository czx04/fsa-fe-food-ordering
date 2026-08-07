import bcrypt from 'bcryptjs'
import { User, IUser } from '../models/User.js'
import { generateTokens } from '../utils/jwt.js'

export const loginUser = async (email: string, passwordRaw: string) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +refreshTokens')
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

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  role?: 'customer' | 'restaurant_owner'
}

export const registerUser = async (payload: RegisterPayload) => {
  const { fullName, email, phone, password, role = 'customer' } = payload

  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPhone = phone.trim()

  const existingEmail = await User.findOne({ email: normalizedEmail })
  if (existingEmail) {
    throw new Error('Email này đã được sử dụng.')
  }

  const existingPhone = await User.findOne({ phone: normalizedPhone })
  if (existingPhone) {
    throw new Error('Số điện thoại này đã được sử dụng.')
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const newUser = new User({
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    role,
    status: 'active', // Trạng thái mặc định là active theo yêu cầu
  })

  await newUser.save()

  return {
    _id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    status: newUser.status,
  }
}

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    throw new Error('Email không tồn tại trong hệ thống.')
  }

  // Import PasswordResetToken
  const { PasswordResetToken } = await import('../models/PasswordResetToken.js')

  const resetTokenRaw = Math.floor(100000 + Math.random() * 900000).toString() // 6 digit OTP token for easy testing
  const tokenHash = await bcrypt.hash(resetTokenRaw, 8)

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  })

  // Return reset token for UI display/testing since Nodemailer is pending
  return {
    message: 'Mã xác thực đổi mật khẩu đã được khởi tạo thành công.',
    resetToken: resetTokenRaw, // For dev testing
  }
}

export const resetPasswordWithToken = async (email: string, resetTokenRaw: string, newPasswordRaw: string) => {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
  if (!user) {
    throw new Error('Người dùng không tồn tại.')
  }

  const { PasswordResetToken } = await import('../models/PasswordResetToken.js')

  const activeTokens = await PasswordResetToken.find({
    userId: user._id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  })

  let validTokenDoc = null
  for (const doc of activeTokens) {
    const isMatch = await bcrypt.compare(resetTokenRaw, doc.tokenHash)
    if (isMatch) {
      validTokenDoc = doc
      break
    }
  }

  if (!validTokenDoc) {
    throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn.')
  }

  // Update password
  user.passwordHash = await bcrypt.hash(newPasswordRaw, 10)
  user.failedLoginCount = 0
  user.status = 'active'
  user.lockedUntil = null
  await user.save()

  // Mark token as used
  validTokenDoc.usedAt = new Date()
  await validTokenDoc.save()

  return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' }
}


