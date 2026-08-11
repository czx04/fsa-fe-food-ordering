import bcrypt from 'bcrypt'
import { User, IUser } from '../models/User.js'
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js'
import { env } from '../config/env.js'

export const loginUser = async (email: string, passwordRaw: string) => {
  const user = await User.findOne({ email: email.toLowerCase().trim(), deletedAt: null }).select('+passwordHash +refreshTokens')
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
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
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

export const refreshSession = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken)
  if (!decoded) throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.')

  const user = await User.findOne({ _id: decoded.userId, deletedAt: null }).select('+refreshTokens')
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new Error('Phiên đăng nhập không còn hiệu lực.')
  }
  if (user.status === 'locked') throw new Error('Tài khoản đang bị khóa.')

  const tokens = generateTokens(user)
  user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken)
  user.refreshTokens.push(tokens.refreshToken)
  await user.save()
  return tokens
}

export const logoutSession = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken)
  if (!decoded) return
  const user = await User.findById(decoded.userId).select('+refreshTokens')
  if (!user) return
  user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken)
  await user.save()
}

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  role?: 'customer' | 'restaurant_owner'
}

import crypto from 'crypto'
import { sendVerificationEmail } from './emailService.js'

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
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours

  const newUser = new User({
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    role,
    status: 'pending_verification',
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  })

  await newUser.save()

  const { accessToken, refreshToken } = generateTokens(newUser)
  newUser.refreshTokens.push(refreshToken)
  await newUser.save()

  // Gửi email xác thực Ethereal
  const emailResult = await sendVerificationEmail(newUser.email, verificationToken)

  return {
    user: {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      avatarUrl: newUser.avatarUrl,
    },
    accessToken,
    refreshToken,
    previewUrl: emailResult?.previewUrl || null,
    verificationLink: emailResult?.verificationLink || null,
  }
}

export const verifyEmailToken = async (token: string) => {
  if (!token) throw new Error('Mã xác nhận không hợp lệ.')

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires')

  if (!user) {
    throw new Error('Link xác thực không hợp lệ hoặc đã hết hạn.')
  }

  user.status = 'active'
  user.emailVerifiedAt = new Date()
  user.emailVerificationToken = null
  user.emailVerificationExpires = null
  await user.save()

  return {
    message: 'Xác thực email thành công! Bạn hiện có thể đăng nhập.',
    email: user.email,
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

  // Trả token về client CHỈ trong môi trường development để tiện kiểm thử.
  // Trong production, OTP phải được gửi qua email (nodemailer) và KHÔNG BAO GIỜ
  // trả về trong response — tránh lộ mã xác thực qua API.
  const result: { message: string; resetToken?: string } = {
    message: 'Mã xác thực đổi mật khẩu đã được khởi tạo thành công.',
  }

  if (env.nodeEnv !== 'production') {
    result.resetToken = resetTokenRaw
  }

  return result
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
