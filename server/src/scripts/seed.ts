import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { CuisineCategory } from '../models/CuisineCategory.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'
import { MenuCategory } from '../models/MenuCategory.js'

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

const everyDay = (open: string, close: string) =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    slots: [{ open, close }],
  }))

const seedData = async () => {
  try {
    await connectDB()

    console.log('Clearing existing data...')
    await User.deleteMany({})
    await CuisineCategory.deleteMany({})
    await Restaurant.deleteMany({})
    await MenuItem.deleteMany({})
    await MenuCategory.deleteMany({})

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

    console.log('Creating cuisine categories...')
    const catPho = await CuisineCategory.create({ name: 'Phở & Bún', slug: 'pho-bun', imageUrl: '/assets/noodles.jpg', displayOrder: 1 })
    const catCom = await CuisineCategory.create({ name: 'Cơm Văn Phòng', slug: 'com-van-phong', imageUrl: '/assets/chicken.jpg', displayOrder: 2 })
    const catAnVat = await CuisineCategory.create({ name: 'Ăn Vặt Vỉa Hè', slug: 'an-vat-via-he', imageUrl: '/assets/burger.jpg', displayOrder: 3 })
    await CuisineCategory.create({ name: 'Trà Sữa & Cafe', slug: 'tra-sua-cafe', imageUrl: '/assets/drink.jpg', displayOrder: 4 })
    await CuisineCategory.create({ name: 'Healthy & Salad', slug: 'healthy-salad', imageUrl: '/assets/salad.jpg', displayOrder: 5 })
    const catPizza = await CuisineCategory.create({ name: 'Pizza & Âu', slug: 'pizza-au', imageUrl: '/assets/pizza.jpg', displayOrder: 6 })

    console.log('Creating restaurants...')
    // Owner 1 has 2 restaurants
    const res1 = await Restaurant.create({
      ownerId: owner1._id,
      cuisineCategoryIds: [catPho._id],
      name: 'Phở Thìn Lò Đúc',
      slug: 'pho-thin-lo-duc',
      description: 'Đặc sản phở bò Hà Nội với nước dùng đậm đà.',
      address: { line1: '13 Lò Đúc', ward: 'Phường Phạm Đình Hổ', district: 'Quận Hai Bà Trưng', city: 'Hà Nội' },
      phone: '0901234567',
      logoUrl: '/assets/noodles.jpg',
      coverUrl: '/assets/noodles.jpg',
      openingHours: everyDay('06:00', '21:00'),
      delivery: { fee: 15000, minMinutes: 20, maxMinutes: 30 },
      priceRange: 'budget',
      approvalStatus: 'approved',
      operationStatus: 'open',
      ratingSummary: { average: 4.9, count: 320 },
      stats: { completedOrderCount: 520, totalItemSold: 840 },
    })

    const res2 = await Restaurant.create({
      ownerId: owner1._id,
      cuisineCategoryIds: [catCom._id, catAnVat._id],
      name: 'Cơm Rang Dưa Bò Bà Yến',
      slug: 'com-rang-dua-bo-ba-yen',
      description: 'Cơm rang nóng hổi phục vụ nhanh cho bữa trưa và tối.',
      address: { line1: '24 Tôn Thất Tùng', ward: 'Phường Khương Thượng', district: 'Quận Đống Đa', city: 'Hà Nội' },
      phone: '0902345678',
      logoUrl: '/assets/chicken.jpg',
      coverUrl: '/assets/chicken.jpg',
      openingHours: everyDay('10:00', '22:00'),
      delivery: { fee: 12000, minMinutes: 20, maxMinutes: 30 },
      priceRange: 'budget',
      approvalStatus: 'approved',
      operationStatus: 'open',
      ratingSummary: { average: 4.7, count: 240 },
      stats: { completedOrderCount: 410, totalItemSold: 680 },
    })

    // Owner 2 has 1 restaurant
    const res3 = await Restaurant.create({
      ownerId: owner2._id,
      cuisineCategoryIds: [catPizza._id],
      name: "Pizza 4P's Tràng Tiền",
      slug: 'pizza-4ps-trang-tien',
      description: 'Pizza nướng lò củi cùng phô mai nhà làm.',
      address: { line1: '43 Tràng Tiền', ward: 'Phường Tràng Tiền', district: 'Quận Hoàn Kiếm', city: 'Hà Nội' },
      phone: '0903456789',
      logoUrl: '/assets/pizza.jpg',
      coverUrl: '/assets/pizza.jpg',
      openingHours: everyDay('10:00', '22:30'),
      delivery: { fee: 0, minMinutes: 25, maxMinutes: 35 },
      priceRange: 'premium',
      approvalStatus: 'approved',
      operationStatus: 'open',
      ratingSummary: { average: 4.8, count: 560 },
      stats: { completedOrderCount: 920, totalItemSold: 1480 },
    })

    console.log('Creating menu categories...')
    const menuCatPho1 = await MenuCategory.create({ restaurantId: res1._id, name: 'Phở Bò Hà Nội', displayOrder: 1 })
    const menuCatPho2 = await MenuCategory.create({ restaurantId: res1._id, name: 'Món thêm', displayOrder: 2 })

    const menuCatCom1 = await MenuCategory.create({ restaurantId: res2._id, name: 'Cơm Rang', displayOrder: 1 })
    const menuCatCom2 = await MenuCategory.create({ restaurantId: res2._id, name: 'Món Xào', displayOrder: 2 })
    const menuCatCom3 = await MenuCategory.create({ restaurantId: res2._id, name: 'Canh', displayOrder: 3 })

    const menuCatPizza1 = await MenuCategory.create({ restaurantId: res3._id, name: 'Pizza Nướng Củi', displayOrder: 1 })
    const menuCatPizza2 = await MenuCategory.create({ restaurantId: res3._id, name: 'Mì Ý & Salad', displayOrder: 2 })

    console.log('Creating menu items...')
    // Menu items for res1 (Phở Thìn)
    const phoTypes = ['Phở Tái Lăn', 'Phở Nạm Gầu', 'Phở Bắp Bò', 'Phở Đặc Biệt']
    for (let i = 0; i < phoTypes.length; i++) {
      await MenuItem.create({
        restaurantId: res1._id,
        menuCategoryId: menuCatPho1._id,
        name: phoTypes[i],
        description: 'Đặc sản phở Hà Nội với nước dùng đậm đà',
        price: 60000 + i * 10000,
        imageUrl: '/assets/noodles.jpg',
      })
    }
    await MenuItem.create({
      restaurantId: res1._id,
      menuCategoryId: menuCatPho2._id,
      name: 'Quẩy Giòn',
      description: 'Quẩy nóng giòn ăn kèm phở',
      price: 10000,
      imageUrl: '/assets/noodles.jpg',
    })

    // Menu items for res2 (Cơm Rang)
    await MenuItem.create({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Dưa Bò', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 55000, imageUrl: '/assets/chicken.jpg' })
    await MenuItem.create({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Đảo Gà Rang', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 60000, imageUrl: '/assets/chicken.jpg' })
    await MenuItem.create({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Hải Sản', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 65000, imageUrl: '/assets/chicken.jpg' })
    await MenuItem.create({ restaurantId: res2._id, menuCategoryId: menuCatCom3._id, name: 'Canh Cải Thăn Băm', description: 'Canh nóng cho bữa cơm', price: 25000, imageUrl: '/assets/chicken.jpg' })
    await MenuItem.create({ restaurantId: res2._id, menuCategoryId: menuCatCom2._id, name: 'Bò Lúc Lắc Khoai Tây', description: 'Bò xào đậm đà', price: 80000, imageUrl: '/assets/chicken.jpg' })

    // Menu items for res3 (Pizza 4P's)
    await MenuItem.create({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza Margherita',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 150000,
      imageUrl: '/assets/pizza.jpg',
    })
    await MenuItem.create({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza 4 Phô Mai',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 180000,
      imageUrl: '/assets/pizza.jpg',
    })
    await MenuItem.create({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza2._id,
      name: 'Mì Ý Hải Sản',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 200000,
      imageUrl: '/assets/pizza.jpg',
    })

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seedData()
