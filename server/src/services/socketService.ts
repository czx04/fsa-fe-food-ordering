import { getIoInstance } from '../socket.js'
import { OrderDetail } from '../types/order.js'

const ORDER_UPDATED_EVENT = 'order:updated'

/**
 * Emits an event to the specific order room and the restaurant room
 * when an order's status is updated.
 * @param order - The updated order detail object.
 */
export const emitOrderUpdate = (order: OrderDetail) => {
  try {
    const io = getIoInstance()
    io.to(`order:${order._id}`).emit(ORDER_UPDATED_EVENT, order)
    io.to(`restaurant:${order.restaurantId}`).emit(ORDER_UPDATED_EVENT, order)
  } catch (error) {
    console.error('Error emitting socket event for order update:', error)
  }
}
