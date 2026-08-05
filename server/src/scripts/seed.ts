import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { Category } from '../models/Category.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'

const connectDB = async () => {
  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbDbName,
    })
    console.log('MongoDB connected for seeding.')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const seedData = async () => {
  try {
    await connectDB()

    console.log('Clearing existing data...')
    await User.deleteMany({})
    await Category.deleteMany({})
    await Restaurant.deleteMany({})
    await MenuItem.deleteMany({})

    console.log('Creating users...')
    const passwordHash = await bcrypt.hash('password123', 10)

    const admin = await User.create({
      email: 'admin@foodordering.com',
      phone: '0900000001',
      passwordHash,
      fullName: 'System Admin',
      role: 'admin',
    })

    const owner1 = await User.create({
      email: 'owner1@foodordering.com',
      phone: '0900000002',
      passwordHash,
      fullName: 'Restaurant Owner 1',
      role: 'restaurant_owner',
    })

    const owner2 = await User.create({
      email: 'owner2@foodordering.com',
      phone: '0900000003',
      passwordHash,
      fullName: 'Restaurant Owner 2',
      role: 'restaurant_owner',
    })

    const customer = await User.create({
      email: 'customer@foodordering.com',
      phone: '0900000004',
      passwordHash,
      fullName: 'John Customer',
      role: 'customer',
    })

    console.log('Creating categories...')
    const catPho = await Category.create({ name: 'Phở & Bún', imageUrl: '/assets/noodles.jpg', displayOrder: 1 })
    const catCom = await Category.create({ name: 'Cơm Văn Phòng', imageUrl: '/assets/chicken.jpg', displayOrder: 2 })
    const catAnVat = await Category.create({ name: 'Ăn Vặt Vỉa Hè', imageUrl: '/assets/burger.jpg', displayOrder: 3 })
    const catTraSua = await Category.create({ name: 'Trà Sữa & Cafe', imageUrl: '/assets/drink.jpg', displayOrder: 4 })
    const catHealthy = await Category.create({ name: 'Healthy & Salad', imageUrl: '/assets/salad.jpg', displayOrder: 5 })
    const catPizza = await Category.create({ name: 'Pizza & Âu', imageUrl: '/assets/pizza.jpg', displayOrder: 6 })

    console.log('Creating restaurants...')
    // Owner 1 has 2 restaurants
    const res1 = await Restaurant.create({
      ownerId: owner1._id,
      name: 'Phở Thìn Lò Đúc',
      address: '13 Lò Đúc, Q. Hai Bà Trưng, Hà Nội',
      phone: '0901234567',
      coverImage: '/assets/noodles.jpg',
      rating: 4.9,
      openTime: '06:00',
      closeTime: '21:00',
      categories: [catPho._id],
    })

    const res2 = await Restaurant.create({
      ownerId: owner1._id,
      name: 'Cơm Rang Dưa Bò Bà Yến',
      address: '24 Tôn Thất Tùng, Q. Đống Đa, Hà Nội',
      phone: '0902345678',
      coverImage: '/assets/chicken.jpg',
      rating: 4.7,
      openTime: '10:00',
      closeTime: '22:00',
      categories: [catCom._id, catAnVat._id],
    })

    // Owner 2 has 1 restaurant
    const res3 = await Restaurant.create({
      ownerId: owner2._id,
      name: "Pizza 4P's Tràng Tiền",
      address: '43 Tràng Tiền, Q. Hoàn Kiếm, Hà Nội',
      phone: '0903456789',
      coverImage: '/assets/pizza.jpg',
      rating: 4.8,
      openTime: '10:00',
      closeTime: '22:30',
      categories: [catPizza._id],
    })

    console.log('Creating menu items...')
    // Menu items for res1 (Phở Thìn)
    const phoTypes = ['Phở Tái Lăn', 'Phở Nạm Gầu', 'Phở Bắp Bò', 'Phở Đặc Biệt', 'Quẩy Giòn']
    for (let i = 0; i < phoTypes.length; i++) {
      await MenuItem.create({
        restaurantId: res1._id,
        name: phoTypes[i],
        description: 'Đặc sản phở Hà Nội với nước dùng đậm đà',
        price: 60000 + i * 10000,
        imageUrl: '/assets/noodles.jpg',
      })
    }

    // Menu items for res2 (Cơm Rang)
    const comTypes = ['Cơm Rang Dưa Bò', 'Cơm Đảo Gà Rang', 'Cơm Rang Hải Sản', 'Canh Cải Thăn Băm', 'Bò Lúc Lắc Khoai Tây']
    for (let i = 0; i < comTypes.length; i++) {
      await MenuItem.create({
        restaurantId: res2._id,
        name: comTypes[i],
        description: 'Cơm chuẩn vị văn phòng, nóng hổi',
        price: 55000 + i * 5000,
        imageUrl: '/assets/chicken.jpg',
      })
    }

    // Menu items for res3 (Pizza 4P's)
    const pizzaTypes = ['Pizza Margherita', 'Pizza 4 Phô Mai', 'Pizza Gà Teriyaki', 'Mì Ý Hải Sản', 'Salad Dầu Giấm']
    for (let i = 0; i < pizzaTypes.length; i++) {
      await MenuItem.create({
        restaurantId: res3._id,
        name: pizzaTypes[i],
        description: 'Đồ âu chuẩn vị, nướng lò củi',
        price: 150000 + i * 20000,
        imageUrl: '/assets/pizza.jpg',
      })
    }

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seedData()
