import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { IUser } from '../models/User.js'

export const generateTokens = (user: IUser) => {
  const payload = {
    userId: user._id,
    role: user.role,
  }

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: '15m',
  })

  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: '7d',
  })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret) as { userId: string; role: string }
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret) as { userId: string; role: string }
  } catch (error) {
    return null
  }
}
