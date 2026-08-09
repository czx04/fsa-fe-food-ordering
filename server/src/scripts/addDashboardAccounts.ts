import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { MenuItem } from '../models/MenuItem.js'
import { Order } from '../models/Order.js'
import { Restaurant } from '../models/Restaurant.js'
import { User, type UserRole } from '../models/User.js'

const password = process.env.DASHBOARD_ACCOUNT_PASSWORD ?? 'password123'

const accounts: Array<{ email: string; phone: string; fullName: string; role: UserRole }> = [
  {
    email: 'dashboard.admin@foodordering.com',
    phone: '0988000101',
    fullName: 'Dashboard Admin',
    role: 'admin',
  },
  {
    email: 'dashboard.owner@foodordering.com',
    phone: '0988000102',
    fullName: 'Dashboard Owner',
    role: 'restaurant_owner',
  },
]

const businessCounts = async () => ({
  restaurants: await Restaurant.countDocuments({}),
  orders: await Order.countDocuments({}),
  menuItems: await MenuItem.countDocuments({}),
})

try {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDbName })
  const before = await businessCounts()
  const passwordHash = await bcrypt.hash(password, 10)
  const results: Array<{ email: string; role: UserRole; result: 'created' | 'already_exists' }> = []

  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email }).select('_id role')
    if (existing) {
      results.push({ email: account.email, role: existing.role, result: 'already_exists' })
      continue
    }

    const phoneOwner = await User.exists({ phone: account.phone })
    if (phoneOwner) throw new Error(`Số điện thoại dành cho ${account.email} đã được tài khoản khác sử dụng.`)

    await User.create({
      ...account,
      passwordHash,
      status: 'active',
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
    })
    results.push({ email: account.email, role: account.role, result: 'created' })
  }

  const after = await businessCounts()
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error('Phát hiện số lượng dữ liệu nghiệp vụ thay đổi ngoài dự kiến.')
  }

  console.log(JSON.stringify({ database: env.mongodbDbName, results, businessDataPreserved: before }, null, 2))
} finally {
  await mongoose.disconnect()
}
