import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { CuisineCategory } from '../models/CuisineCategory.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'
import { MenuCategory } from '../models/MenuCategory.js'
import { Coupon, CouponUsage } from '../models/Coupon.js'
import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'
import { Review } from '../models/Review.js'
import { AuditLog } from '../models/AuditLog.js'
import { seedImageUrl } from './seed/imageUrls.js'

const image = (localPath: string) => seedImageUrl(localPath)

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
    await AuditLog.deleteMany({})
    await Review.deleteMany({})
    await CouponUsage.deleteMany({})
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
      status: 'active',
      emailVerifiedAt: new Date(),
    })

    const owner1 = await User.create({
      email: 'owner1@foodordering.com',
      phone: '0900000002',
      passwordHash,
      fullName: 'Restaurant Owner 1',
      role: 'restaurant_owner',
      status: 'active',
      emailVerifiedAt: new Date(),
    })

    const owner2 = await User.create({
      email: 'owner2@foodordering.com',
      phone: '0900000003',
      passwordHash,
      fullName: 'Restaurant Owner 2',
      role: 'restaurant_owner',
      status: 'active',
      emailVerifiedAt: new Date(),
    })

    const customer = await User.create({
      email: 'customer@foodordering.com',
      phone: '0900000004',
      passwordHash,
      fullName: 'John Customer',
      role: 'customer',
      status: 'active',
      emailVerifiedAt: new Date(),
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

    await User.create({
      email: 'locked@foodordering.com',
      phone: '0900000005',
      passwordHash,
      fullName: 'Locked Customer',
      role: 'customer',
      status: 'locked',
      emailVerifiedAt: new Date(),
    })

    console.log('Creating cuisine categories...')
    const catPho = await CuisineCategory.create({ name: 'Phở & Bún', slug: 'pho-bun', imageUrl: image('/assets/noodles.jpg'), displayOrder: 1 })
    const catCom = await CuisineCategory.create({ name: 'Cơm Văn Phòng', slug: 'com-van-phong', imageUrl: image('/assets/chicken.jpg'), displayOrder: 2 })
    const catAnVat = await CuisineCategory.create({ name: 'Ăn Vặt Vỉa Hè', slug: 'an-vat-via-he', imageUrl: image('/assets/burger.jpg'), displayOrder: 3 })
    await CuisineCategory.create({ name: 'Trà Sữa & Cafe', slug: 'tra-sua-cafe', imageUrl: image('/assets/drink.jpg'), displayOrder: 4 })
    await CuisineCategory.create({ name: 'Healthy & Salad', slug: 'healthy-salad', imageUrl: image('/assets/salad.jpg'), displayOrder: 5 })
    const catPizza = await CuisineCategory.create({ name: 'Pizza & Âu', slug: 'pizza-au', imageUrl: image('/assets/pizza.jpg'), displayOrder: 6 })

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
      logoUrl: image('/assets/noodles.jpg'),
      coverUrl: image('/assets/noodles.jpg'),
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
      logoUrl: image('/assets/chicken.jpg'),
      coverUrl: image('/assets/chicken.jpg'),
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
      logoUrl: image('/assets/pizza.jpg'),
      coverUrl: image('/assets/pizza.jpg'),
      openingHours: everyDay('10:00', '22:30'),
      delivery: { fee: 0, minMinutes: 25, maxMinutes: 35 },
      priceRange: 'premium',
      approvalStatus: 'approved',
      operationStatus: 'open',
      ratingSummary: { average: 4.8, count: 560 },
      stats: { completedOrderCount: 920, totalItemSold: 1480 },
    })

    await Restaurant.create({
      ownerId: owner1._id,
      cuisineCategoryIds: [catAnVat._id],
      name: 'Bếp Mới Chờ Duyệt',
      slug: 'bep-moi-cho-duyet',
      description: 'Hồ sơ mẫu để kiểm thử luồng phê duyệt nhà hàng mới.',
      address: { line1: '10 Nguyễn Trãi', ward: 'Phường Thượng Đình', district: 'Quận Thanh Xuân', city: 'Hà Nội' },
      phone: '0904567890',
      openingHours: everyDay('09:00', '21:00'),
      delivery: { fee: 15000, minMinutes: 25, maxMinutes: 40 },
      priceRange: 'mid',
      approvalStatus: 'pending',
      operationStatus: 'temporarily_closed',
    })

    await Restaurant.create({
      ownerId: owner2._id,
      cuisineCategoryIds: [catPizza._id],
      name: 'Bếp Âu Hồ Sơ Bị Từ Chối',
      slug: 'bep-au-ho-so-bi-tu-choi',
      description: 'Hồ sơ mẫu để kiểm thử trạng thái bị từ chối và nộp lại.',
      address: { line1: '22 Hai Bà Trưng', ward: 'Phường Tràng Tiền', district: 'Quận Hoàn Kiếm', city: 'Hà Nội' },
      phone: '0905678901',
      openingHours: everyDay('10:00', '22:00'),
      delivery: { fee: 20000, minMinutes: 30, maxMinutes: 45 },
      priceRange: 'premium',
      approvalStatus: 'rejected',
      operationStatus: 'temporarily_closed',
      rejectionReason: 'Ảnh giấy tờ và thông tin địa chỉ chưa đầy đủ.',
    })

    const suspendedRestaurant = await Restaurant.create({
      ownerId: owner2._id,
      cuisineCategoryIds: [catCom._id],
      name: 'Cơm Nhà Tạm Đình Chỉ',
      slug: 'com-nha-tam-dinh-chi',
      description: 'Nhà hàng mẫu để kiểm thử thao tác đình chỉ và gỡ đình chỉ.',
      address: { line1: '18 Cầu Giấy', ward: 'Phường Quan Hoa', district: 'Quận Cầu Giấy', city: 'Hà Nội' },
      phone: '0906789012',
      openingHours: everyDay('10:00', '20:30'),
      delivery: { fee: 10000, minMinutes: 20, maxMinutes: 35 },
      priceRange: 'budget',
      approvalStatus: 'approved',
      operationStatus: 'suspended',
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
        imageUrl: image('/assets/noodles.jpg'),
      })
    }
    await createMenuItem({
      restaurantId: res1._id,
      menuCategoryId: menuCatPho2._id,
      name: 'Quẩy Giòn',
      slug: 'quay-gion',
      description: 'Quẩy nóng giòn ăn kèm phở',
      price: 10000,
      imageUrl: image('/assets/noodles.jpg'),
    })

    // Menu items for res2 (Cơm Rang)
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Dưa Bò', slug: 'com-rang-dua-bo', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 55000, imageUrl: image('/assets/chicken.jpg') })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Đảo Gà Rang', slug: 'com-dao-ga-rang', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 60000, imageUrl: image('/assets/chicken.jpg') })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom1._id, name: 'Cơm Rang Hải Sản', slug: 'com-rang-hai-san', description: 'Cơm chuẩn vị văn phòng, nóng hổi', price: 65000, imageUrl: image('/assets/chicken.jpg') })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom3._id, name: 'Canh Cải Thăn Băm', slug: 'canh-cai-than-bam', description: 'Canh nóng cho bữa cơm', price: 25000, imageUrl: image('/assets/chicken.jpg') })
    await createMenuItem({ restaurantId: res2._id, menuCategoryId: menuCatCom2._id, name: 'Bò Lúc Lắc Khoai Tây', slug: 'bo-luc-lac-khoai-tay', description: 'Bò xào đậm đà', price: 80000, imageUrl: image('/assets/chicken.jpg') })

    // Menu items for res3 (Pizza 4P's)
    const pizzaMargherita = await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza Margherita',
      slug: 'pizza-margherita',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 150000,
      imageUrl: image('/assets/pizza.jpg'),
    })
    await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza1._id,
      name: 'Pizza 4 Phô Mai',
      slug: 'pizza-4-pho-mai',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 180000,
      imageUrl: image('/assets/pizza.jpg'),
    })
    await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza2._id,
      name: 'Mì Ý Hải Sản',
      slug: 'mi-y-hai-san',
      description: 'Đồ âu chuẩn vị, nướng lò củi',
      price: 200000,
      imageUrl: image('/assets/pizza.jpg'),
    })

    const cocaCola = await createMenuItem({
      restaurantId: res3._id,
      menuCategoryId: menuCatPizza2._id,
      name: 'Coca-Cola',
      slug: 'coca-cola',
      description: 'Nước ngọt Coca-Cola lon 330ml',
      price: 20000,
      imageUrl: image('/assets/pizza.jpg'),
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
    await Coupon.create({ code: 'TAMTAT20', discountType: 'percentage', discountValue: 20, minOrderAmount: 100000, maxDiscountAmount: 50000, startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: 'disabled' })
    await Coupon.create({ code: 'HETHAN25', discountType: 'fixed', discountValue: 25000, minOrderAmount: 150000, startsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), endsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'expired' })

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
      subtotal: 190000,
      discountAmount: 10000,
      grandTotal: 180000,
      couponId: coupon._id,
    })

    console.log('Creating order...')
    const orderPlacedAt = new Date('2026-08-07T08:00:00Z')
    const deliveredOrder = await Order.create({
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

    console.log('Creating review and audit fixtures...')
    await Review.create({
      orderId: deliveredOrder._id,
      customerId: customer._id,
      restaurantId: res3._id,
      rating: 4,
      content: 'Món ngon nhưng thời gian giao hơi lâu, cần kiểm tra nội dung trước khi hiển thị.',
      imageUrls: [image('/assets/pizza.jpg')],
      visibilityStatus: 'flagged',
    })
    await AuditLog.create({
      actorId: admin._id,
      actorRole: 'admin',
      action: 'restaurant.suspended',
      entityType: 'Restaurant',
      entityId: String(suspendedRestaurant._id),
      reason: 'Dữ liệu mẫu cho dashboard kiểm thử nhật ký.',
      before: 'open',
      after: 'suspended',
      ip: '127.0.0.1',
      userAgent: 'seed-script',
    })

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

await seedData()
