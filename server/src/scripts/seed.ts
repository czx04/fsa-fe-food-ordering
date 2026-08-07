import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { CuisineCategory } from '../models/CuisineCategory.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'
import { MenuCategory } from '../models/MenuCategory.js'
import { Coupon } from '../models/Coupon.js'
import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'

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

const buildAddressText = (line1: string, ward: string, district: string, city: string) =>
  `${line1}, ${ward}, ${district}, ${city}`

const createMenuItem = async (params: {
  restaurantId: mongoose.Types.ObjectId
  menuCategoryId: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string
}) => {
  return MenuItem.create({
    restaurantId: params.restaurantId,
    menuCategoryId: params.menuCategoryId,
    name: params.name,
    slug: params.slug,
    shortDescription: params.description,
    description: params.description,
    ingredients: [],
    imageUrls: [params.imageUrl],
    basePrice: params.price,
    salePrice: null,
    isAvailable: true,
    isVisible: true,
    soldCount: 0,
    optionGroups: [],
  })
}

const seedData = async () => {
  try {
    await connectDB()

    console.log('Clearing existing data...')
    await Order.deleteMany({})
    await Cart.deleteMany({})
    await Coupon.deleteMany({})
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
      addresses: [
        {
          label: 'Nhà riêng',
          recipientName: 'John Customer',
          phone: '0900000004',
          line1: '43 Tràng Tiền',
          ward: 'Phường Tràng Tiền',
          district: 'Quận Hoàn Kiếm',
          city: 'Hà Nội',
          location: { type: 'Point', coordinates: [105.853, 21.024] },
          isDefault: true,
        },
      ],
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
    const menuCatPho1 = await MenuCategory.create({ restaurantId: res1._id, name: 'Phở Bò Hà Nội', slug: 'pho-bo-ha-noi', displayOrder: 1, isVisible: true })
    const menuCatPho2 = await MenuCategory.create({ restaurantId: res1._id, name: 'Món thêm', slug: 'mon-them', displayOrder: 2, isVisible: true })

    const menuCatCom1 = await MenuCategory.create({ restaurantId: res2._id, name: 'Cơm Rang', slug: 'com-rang', displayOrder: 1, isVisible: true })
    const menuCatCom2 = await MenuCategory.create({ restaurantId: res2._id, name: 'Món Xào', slug: 'mon-xao', displayOrder: 2, isVisible: true })
    const menuCatCom3 = await MenuCategory.create({ restaurantId: res2._id, name: 'Canh', slug: 'canh', displayOrder: 3, isVisible: true })

    const menuCatPizza1 = await MenuCategory.create({ restaurantId: res3._id, name: 'Pizza Nướng Củi', slug: 'pizza-nuong-cui', displayOrder: 1, isVisible: true })
    const menuCatPizza2 = await MenuCategory.create({ restaurantId: res3._id, name: 'Mì Ý & Salad', slug: 'mi-y-salad', displayOrder: 2, isVisible: true })

    console.log('Creating menu items...')
    // Menu items for res1 (Phở Thìn)
    const phoTypes = ['Phở Tái Lăn', 'Phở Nạm Gầu', 'Phở Bắp Bò', 'Phở Đặc Biệt']
    for (const [index, itemName] of phoTypes.entries()) {
      await createMenuItem({
        restaurantId: res1._id,
        menuCategoryId: menuCatPho1._id,
        name: itemName,
        slug: `pho-thin-${index + 1}`,
        description: 'Đặc sản phở Hà Nội với nước dùng đậm đà',
        price: 60000 + index * 10000,
        imageUrl: '/assets/noodles.jpg',
      })
    }
    await createMenuItem({
      restaurantId: res1._id,
      menuCategoryId: menuCatPho2._id,
      name: 'Quẩy Giòn',
      slug: 'quay-gion',
      description: 'Quẩy nóng giòn ăn kèm phở',
      price: 10000,
      imageUrl: '/assets/noodles.jpg',
    })

    // Menu items for res2 (Cơm Rang)
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Dưa Bò', slug: 'com-rang-dua-bo', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 55000, imageUrl: '/assets/chicken.jpg' })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Đảo Gà Rang', slug: 'com-dao-ga-rang', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 60000, imageUrl: '/assets/chicken.jpg' })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Hải Sản', slug: 'com-rang-hai-san', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 65000, imageUrl: '/assets/chicken.jpg' })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom3._id, name: 'Canh Cải Thăn Băm', slug: 'canh-cai-than-bam', description: 'Canh nóng cho bữa cơm', price: 25000, imageUrl: '/assets/chicken.jpg' })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom2._id, name: 'Bò Lúc Lắc Khoai Tây', slug: 'bo-luc-lac-khoai-tay', description: 'Bò xào đậm đà', price: 80000, imageUrl: '/assets/chicken.jpg' })

    // Menu items for res3 (Pizza 4P's)
    const pizzaMargherita = await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza Margherita',
      slug: 'pizza-margherita',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 150000,
      imageUrl: '/assets/pizza.jpg',
    })
    await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza 4 Phô Mai',
      slug: 'pizza-4-pho-mai',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 180000,
      imageUrl: '/assets/pizza.jpg',
    })
    await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza2._id,
      name: 'Mì Ý Hải Sản',
      slug: 'mi-y-hai-san',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 200000,
      imageUrl: '/assets/pizza.jpg',
    })

    const cocaCola = await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza2._id,
      name: 'Coca-Cola',
      slug: 'coca-cola',
      description: 'Nước ngọt Coca-Cola lon 330ml',
      price: 20000,
      imageUrl: '/assets/pizza.jpg',
    })

    console.log('Creating coupon...')
    const coupon = await Coupon.create({
      code: 'GIAM10K',
      discountType: 'fixed',
      discountValue: 10000,
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    })

    console.log('Creating cart...')
    await Cart.create({
      userId: customer._id,
      restaurantId: res3._id,
      items: [
        {
          menuItemId: pizzaMargherita._id,
          quantity: 1,
          price: 150000,
        },
        {
          menuItemId: cocaCola._id,
          quantity: 2,
          price: 20000,
        },
      ],
      total: 190000,
    })

    console.log('Creating order...')
    const orderPlacedAt = new Date('2026-08-07T08:00:00Z')
    await Order.create({
      orderNumber: 'FD-20260807-8F2K9A',
      checkoutKey: 'checkout-demo-20260807-0001',
      customerId: customer._id,
      restaurantId: res3._id,
      customerSnapshot: {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      restaurantSnapshot: {
        name: res3.name,
        phone: res3.phone,
        logoUrl: res3.logoUrl,
        addressText: buildAddressText(res3.address.line1, res3.address.ward, res3.address.district, res3.address.city),
      },
      recipient: {
        fullName: customer.fullName,
        phone: customer.phone,
        addressText: buildAddressText('43 Tràng Tiền', 'Phường Tràng Tiền', 'Quận Hoàn Kiếm', 'Hà Nội'),
        ward: 'Phường Tràng Tiền',
        district: 'Quận Hoàn Kiếm',
        city: 'Hà Nội',
        location: { type: 'Point', coordinates: [105.853, 21.024] },
        note: 'Giao sau 18h',
      },
      items: [
        {
          menuItemId: pizzaMargherita._id,
          name: pizzaMargherita.name,
          imageUrl: pizzaMargherita.imageUrls[0] ?? null,
          quantity: 1,
          baseUnitPrice: 150000,
          selectedOptions: [],
          finalUnitPrice: 150000,
          lineTotal: 150000,
          note: null,
        },
        {
          menuItemId: cocaCola._id,
          name: cocaCola.name,
          imageUrl: cocaCola.imageUrls[0] ?? null,
          quantity: 2,
          baseUnitPrice: 20000,
          selectedOptions: [],
          finalUnitPrice: 20000,
          lineTotal: 40000,
          note: null,
        },
      ],
      couponId: coupon._id,
      couponSnapshot: {
        code: coupon.code,
        name: 'Giảm 10.000 VNĐ cho đơn hàng',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      pricing: {
        subtotal: 190000,
        deliveryFee: 0,
        discountAmount: 10000,
        grandTotal: 180000,
        currency: 'VND',
      },
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      statusHistory: [
        {
          from: null,
          to: 'pending',
          changedBy: customer._id,
          changedByRole: 'customer',
          reason: null,
          note: null,
          changedAt: orderPlacedAt,
        },
        {
          from: 'pending',
          to: 'confirmed',
          changedBy: admin._id,
          changedByRole: 'admin',
          reason: null,
          note: null,
          changedAt: new Date('2026-08-07T08:05:00Z'),
        },
        {
          from: 'confirmed',
          to: 'preparing',
          changedBy: owner2._id,
          changedByRole: 'restaurant_owner',
          reason: null,
          note: null,
          changedAt: new Date('2026-08-07T08:15:00Z'),
        },
        {
          from: 'preparing',
          to: 'delivering',
          changedBy: admin._id,
          changedByRole: 'system',
          reason: null,
          note: null,
          changedAt: new Date('2026-08-07T08:35:00Z'),
        },
        {
          from: 'delivering',
          to: 'delivered',
          changedBy: admin._id,
          changedByRole: 'system',
          reason: null,
          note: null,
          changedAt: new Date('2026-08-07T09:00:00Z'),
        },
      ],
      placedAt: orderPlacedAt,
      confirmedAt: new Date('2026-08-07T08:05:00Z'),
      deliveredAt: new Date('2026-08-07T09:00:00Z'),
      cancelledAt: null,
      cancellation: null,
    })

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

await seedData()
