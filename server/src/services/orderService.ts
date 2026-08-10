import createError from 'http-errors'
import { Types } from 'mongoose'
import * as orderRepository from '../repositories/orderRepository.js'
import { OrderDetail, OrderHistoryResponse, CreateOrderPayload } from '../types/order.js'
import { AddToCartRequest } from '../types/cart.js'
import * as cartRepository from '../repositories/cartRepository.js'
import { User } from '../models/User.js'
import { Restaurant } from '../models/Restaurant.js'
import { MenuItem } from '../models/MenuItem.js'
import { Order, IOrderItemSnapshot, IStatusHistory } from '../models/Order.js'
import * as cartService from './cartService.js'
import { createVnpayPaymentUrl } from './paymentService.js'
import { sendOrderConfirmationEmail } from './emailService.js'
import { getReviewsForCustomerOrders } from './reviewService.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export const getOrderHistory = async (
  customerId: string,
  status: string | undefined,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
): Promise<OrderHistoryResponse> => {
  const safePage = Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT

  const { data, totalItems } = await orderRepository.findOrdersByCustomerId(customerId, status, safePage, safeLimit)
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / safeLimit)
  const reviewsByOrderId = await getReviewsForCustomerOrders(
    customerId,
    data.map((order) => order._id),
  )

  return {
    data: data.map((order) => ({
      ...order,
      review: reviewsByOrderId.get(order._id) ?? null,
    })),
    pagination: {
      currentPage: safePage,
      totalPages,
      totalItems,
      limit: safeLimit,
    },
    totalPages,
    total: totalItems,
    limit: safeLimit,
  }
}

export const getOrderDetail = async (
  customerId: string,
  orderId: string,
): Promise<OrderDetail> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'ID đơn hàng không hợp lệ')
  }

  const order = await orderRepository.findOrderById(orderId)

  if (!order) {
    throw createError(404, 'Không tìm thấy đơn hàng')
  }

  if (order.customerId !== customerId) {
    throw createError(403, 'Bạn không có quyền xem đơn hàng này')
  }

  const reviewsByOrderId = await getReviewsForCustomerOrders(customerId, [order._id])
  return {
    ...order,
    review: reviewsByOrderId.get(order._id) ?? null,
  }
}

export const createOrderFromCart = async (
  userId: string,
  payload: CreateOrderPayload,
  req?: any,
): Promise<{ order: { _id: string; orderNumber: string }; paymentUrl?: string }> => {
  const { paymentMethod, deliveryAddress, note } = payload

  const cart = await cartRepository.findCartByUserId(userId)
  if (!cart || cart.items.length === 0) {
    throw createError(400, 'Giỏ hàng của bạn đang trống.')
  }

  const restaurant = cart.restaurantId as any // Cast to any to access populated fields
  if (!restaurant?._id) {
    throw createError(500, 'Thông tin nhà hàng trong giỏ hàng không hợp lệ.')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw createError(404, 'Không tìm thấy thông tin người dùng.')
  }

  const customerSnapshot = {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  }

  const restaurantSnapshot = {
    name: restaurant.name,
    phone: restaurant.phone || 'N/A',
    logoUrl: restaurant.logoUrl || null,
    addressText: `${deliveryAddress.line1}, ${deliveryAddress.ward}, ${deliveryAddress.district}, ${deliveryAddress.city}`,
  }

  let couponSnapshot = null
  if (cart.couponId) {
    const coupon = cart.couponId as any // Cast to access populated fields
    couponSnapshot = {
      code: coupon.code,
      name: coupon.name || 'N/A', // Use populated name, provide default
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    }
  }

  const orderItems: IOrderItemSnapshot[] = cart.items.map(item => {
    const menuItem = item.menuItemId as any // Cast to access populated fields
    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      imageUrl: menuItem.imageUrl || null,
      quantity: item.quantity,
      baseUnitPrice: menuItem.basePrice || item.price,
      selectedOptions: [], // Assuming no options for now, or they are implicitly part of item.price
      finalUnitPrice: item.price,
      lineTotal: item.price * item.quantity,
      note: null,
    }
  })

  const deliveryFee = restaurant.delivery?.fee || 0
  const pricing = {
    subtotal: cart.subtotal,
    deliveryFee: deliveryFee,
    discountAmount: cart.discountAmount,
    grandTotal: cart.grandTotal + deliveryFee,
    currency: 'VND' as const,
  }

  // 5. Generate Order Number and Checkout Key
  const orderNumber = `FD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const checkoutKey = new Types.ObjectId().toString()

  const newOrder = new Order({
    orderNumber,
    checkoutKey,
    customerId: new Types.ObjectId(userId),
    restaurantId: restaurant._id,
    customerSnapshot,
    restaurantSnapshot,
    recipient: {
      fullName: deliveryAddress.recipientName,
      phone: deliveryAddress.phone,
      addressText: `${deliveryAddress.line1}, ${deliveryAddress.ward}, ${deliveryAddress.district}, ${deliveryAddress.city}`,
      ward: deliveryAddress.ward,
      district: deliveryAddress.district,
      city: deliveryAddress.city,
      location: null,
      note: note || null,
    },
    items: orderItems,
    couponId: cart.couponId || null,
    couponSnapshot: couponSnapshot,
    pricing,
    paymentMethod: paymentMethod.toLowerCase(),
    paymentStatus: paymentMethod === 'COD' ? 'paid' : 'unpaid',
    orderStatus: 'pending',
    statusHistory: [{
      to: 'pending',
      changedBy: new Types.ObjectId(userId),
      changedByRole: 'customer',
      changedAt: new Date(),
    }] as IStatusHistory[],
    placedAt: new Date(),
  })

  await newOrder.save()

  await cartService.clearCart(userId)

  // 8. Handle Payment Redirection & Email Trigger
  let paymentUrl: string | undefined
  if (paymentMethod.toUpperCase() === 'VNPAY') {
    paymentUrl = createVnpayPaymentUrl(newOrder, req?.ip)
  } else if (paymentMethod.toUpperCase() === 'COD') {
    sendOrderConfirmationEmail(newOrder).catch(err =>
      console.error('❌ Error sending COD order confirmation email:', err)
    )
  }

  return {
    order: {
      _id: newOrder._id.toString(),
      orderNumber: newOrder.orderNumber,
    },
    paymentUrl,
  }
}

export const reorderOrder = async (
  userId: string,
  orderId: string,
): Promise<{ unavailableItems: Array<{ menuItemId: string; name: string }> }> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'ID đơn hàng không hợp lệ.')
  }

  const order = await orderRepository.findOrderById(orderId)

  if (order?.customerId !== userId) {
    throw createError(404, 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.')
  }

  const restaurantId = order.restaurantId
  const restaurant = await Restaurant.findById(restaurantId)

  if (restaurant?.approvalStatus !== 'approved' || restaurant?.operationStatus !== 'open') {
    throw createError(400, 'Nhà hàng không còn hoạt động hoặc không tồn tại.')
  }

  const unavailableItems: Array<{ menuItemId: string; name: string }> = []
  const itemsToAdd: AddToCartRequest[] = []

  for (const orderItem of order.items) {
    const menuItem = await MenuItem.findById(orderItem.menuItemId)
    if (!menuItem || !menuItem.isAvailable || menuItem.deletedAt) {
      unavailableItems.push({
        menuItemId: orderItem.menuItemId,
        name: orderItem.name,
      })
    } else {
      itemsToAdd.push({
        menuItemId: orderItem.menuItemId.toString(),
        quantity: orderItem.quantity,
        restaurantId: restaurantId.toString(),
      })
    }
  }

  const currentCart = await cartRepository.findCartByUserId(userId)
  const currentCartRestId = currentCart?.restaurantId ? ((currentCart.restaurantId as any)._id?.toString() || currentCart.restaurantId.toString()) : ''
  if (currentCart && currentCartRestId !== restaurantId.toString()) {
    await cartService.clearCart(userId)
  }

  for (const itemPayload of itemsToAdd) {
    await cartService.addItemToCart(userId, itemPayload)
  }

  return { unavailableItems }
}

export const cancelOrder = async (
  customerId: string,
  orderId: string,
  reason: string,
  note?: string,
): Promise<OrderDetail> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'ID đơn hàng không hợp lệ.')
  }

  const order = await Order.findById(orderId)

  if (!order) {
    throw createError(404, 'Không tìm thấy đơn hàng.')
  }

  if (order.customerId.toString() !== customerId) {
    throw createError(403, 'Bạn không có quyền hủy đơn hàng này.')
  }

  if (order.orderStatus !== 'pending') {
    throw createError(400, `Không thể hủy đơn hàng ở trạng thái "${order.orderStatus}".`)
  }

  order.orderStatus = 'cancelled'
  order.cancelledAt = new Date()
  order.cancellation = { cancelledBy: new Types.ObjectId(customerId), reason, cancelledAt: new Date() }
  order.statusHistory.push({ to: 'cancelled', changedBy: new Types.ObjectId(customerId), changedByRole: 'customer', reason, note, changedAt: new Date() })

  await order.save()

  return orderRepository.findOrderById(orderId) as Promise<OrderDetail>
}
