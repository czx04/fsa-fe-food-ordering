import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { IUser } from '../models/User.js'

export const generateTokens = (user: IUser) => {
  const payload = {
    userId: user._id,
    role: user.role,
    status: user.status,
  }

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as any,
  })

  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as any,
  })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret) as { userId: string; role: string; status?: string }
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret) as { userId: string; role: string; status?: string }
  } catch (error) {
    return null
  }
}

