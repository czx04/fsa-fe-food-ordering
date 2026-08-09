import { Types } from 'mongoose'
import { Order } from '../models/Order.js'
import { OrderDetail, OrderSummary } from '../types/order.js'

export const findOrdersByCustomerId = async (
  customerId: string,
  status: string | undefined,
  page: number,
  limit: number,
): Promise<{ data: OrderSummary[]; totalItems: number }> => {
  const filter: Record<string, unknown> = { customerId: new Types.ObjectId(customerId) }

  if (status) {
    filter.orderStatus = status
  }

  const skip = (page - 1) * limit

  const [orders, totalItems] = await Promise.all([
    Order.find(filter)
      .select('_id orderNumber placedAt restaurantSnapshot.name pricing.grandTotal orderStatus items.name items.quantity')
      .sort({ placedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<OrderSummary[]>(),
    Order.countDocuments(filter),
  ])

  return {
    data: orders.map((order) => ({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      placedAt: new Date(order.placedAt).toISOString(),
      restaurantSnapshot: {
        name: order.restaurantSnapshot?.name ?? '',
      },
      pricing: {
        grandTotal: order.pricing?.grandTotal ?? 0,
      },
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
      })),
      orderStatus: order.orderStatus,
    })),
    totalItems,
  }
}

export const findOrderById = async (orderId: string): Promise<OrderDetail | null> => {
  const order = await Order.findById(orderId).select('-__v').lean<OrderDetail>()

  if (!order) {
    return null
  }

  return {
    ...order,
    _id: order._id.toString(),
    checkoutKey: order.checkoutKey,
    customerId: order.customerId.toString(),
    restaurantId: order.restaurantId.toString(),
    couponId: order.couponId ? order.couponId.toString() : null,
    placedAt: new Date(order.placedAt).toISOString(),
    confirmedAt: order.confirmedAt ? new Date(order.confirmedAt).toISOString() : null,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt).toISOString() : null,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
    customerSnapshot: order.customerSnapshot,
    restaurantSnapshot: order.restaurantSnapshot,
    recipient: order.recipient,
    items: order.items.map((item) => ({
      ...item,
      menuItemId: item.menuItemId.toString(),
      selectedOptions: item.selectedOptions.map((option) => ({
        ...option,
        groupId: option.groupId.toString(),
        optionId: option.optionId.toString(),
      })),
    })),
    couponSnapshot: order.couponSnapshot,
    pricing: order.pricing,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    statusHistory: order.statusHistory.map((status) => ({
      ...status,
      from: status.from ?? null,
      changedBy: status.changedBy.toString(),
      changedAt: new Date(status.changedAt).toISOString(),
    })),
    cancellation: order.cancellation
      ? {
        ...order.cancellation,
        cancelledBy: order.cancellation.cancelledBy.toString(),
        cancelledAt: new Date(order.cancellation.cancelledAt).toISOString(),
      }
      : null,
  }
}
