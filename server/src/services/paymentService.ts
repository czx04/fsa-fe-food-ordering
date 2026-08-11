import crypto from 'crypto'
import createError from 'http-errors'
import { Types } from 'mongoose'
import { env } from '../config/env.js'
import { Order } from '../models/Order.js'
import * as orderRepository from '../repositories/orderRepository.js'
import { sendOrderConfirmationEmail } from './emailService.js'
import { OrderDetail } from '../types/order.js'

/**
 * Sort object keys alphabetically and generate query string & sign data for VNPAY HMAC-SHA512
 */
const sortObject = (obj: Record<string, any>) => {
  const sorted: Record<string, any> = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = obj[key]
    }
  }
  return sorted
}

/**
 * Tạo VNPAY Payment URL cho đơn hàng
 */
export const createVnpayPaymentUrl = (order: any, clientIp?: string): string => {
  const date = new Date()
  const gmt7Date = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const createDate = gmt7Date.toISOString().replace(/[^0-9]/g, '').slice(0, 14)

  const ipAddr = clientIp || '127.0.0.1'
  const amount = Math.round(order.pricing.grandTotal * 100)

  const vnpParams: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.vnpTmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order._id.toString(),
    vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount,
    vnp_ReturnUrl: env.vnpReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  }

  const sortedParams = sortObject(vnpParams)
  const signDataParts: string[] = []
  const queryParts: string[] = []

  for (const [key, value] of Object.entries(sortedParams)) {
    const encodedKey = encodeURIComponent(key)
    const encodedVal = encodeURIComponent(String(value)).replace(/%20/g, '+')
    signDataParts.push(`${encodedKey}=${encodedVal}`)
    queryParts.push(`${encodedKey}=${encodedVal}`)
  }

  const signData = signDataParts.join('&')
  const hmac = crypto.createHmac('sha512', env.vnpHashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  queryParts.push(`vnp_SecureHash=${signed}`)

  return `${env.vnpUrl}?${queryParts.join('&')}`
}

/**
 * Xác minh chữ ký SHA512 từ dữ liệu VNPAY gửi về
 */
export const verifyVnpaySignature = (vnpayParams: Record<string, any>): boolean => {
  const secureHash = vnpayParams.vnp_SecureHash
  if (!secureHash) return false

  const paramsCopy = { ...vnpayParams }
  delete paramsCopy.vnp_SecureHash
  delete paramsCopy.vnp_SecureHashType

  const sortedParams = sortObject(paramsCopy)
  const signDataParts: string[] = []

  for (const [key, value] of Object.entries(sortedParams)) {
    const encodedKey = encodeURIComponent(key)
    const encodedVal = encodeURIComponent(String(value)).replace(/%20/g, '+')
    signDataParts.push(`${encodedKey}=${encodedVal}`)
  }

  const signData = signDataParts.join('&')
  const hmac = crypto.createHmac('sha512', env.vnpHashSecret)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  return signed.toLowerCase() === String(secureHash).toLowerCase()
}

/**
 * Xác thực URL trả về từ giao dịch VNPAY (Return URL handler)
 * @param vnpayParams - Tham số query VNPAY gửi về
 * @param userId - ID người dùng đang xác thực (từ verifyToken); không bắt buộc khi chạy IPN.
 */
export const verifyVnpayReturn = async (
  vnpayParams: any,
  userId?: string,
): Promise<OrderDetail> => {
  const orderId = vnpayParams.vnp_TxnRef
  const responseCode = vnpayParams.vnp_ResponseCode
  const vnpAmount = Number(vnpayParams.vnp_Amount)

  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'Thông tin giao dịch không hợp lệ.')
  }

  // LUÔN xác minh chữ ký điện tử. Không bao giờ bỏ qua xác minh vì cờ do client gửi lên
  // (mock/real phải được quyết định bởi env phía server, không phải tham số client).
  const isValidSignature = verifyVnpaySignature(vnpayParams)
  if (!isValidSignature) {
    console.error('❌ VNPAY Signature verification failed for order:', orderId)
    throw createError(400, 'Chữ ký điện tử không hợp lệ.')
  }

  if (responseCode !== '00') {
    throw createError(400, 'Giao dịch thanh toán thất bại tại cổng thanh toán VNPAY.')
  }

  const order = await Order.findById(orderId)
  if (!order) {
    throw createError(404, 'Không tìm thấy đơn hàng tương ứng với giao dịch.')
  }

  // Kiểm tra quyền sở hữu: chỉ khách hàng sở hữu đơn hàng mới được xác nhận thanh toán.
  if (userId && order.customerId.toString() !== userId) {
    throw createError(403, 'Bạn không có quyền xác nhận thanh toán cho đơn hàng này.')
  }

  // Kiểm tra số tiền khớp với đơn hàng.
  const expectedAmount = Math.round(order.pricing.grandTotal * 100)
  if (vnpAmount !== expectedAmount) {
    console.error(
      `❌ VNPAY amount mismatch for order ${orderId}: got ${vnpAmount}, expected ${expectedAmount}`,
    )
    throw createError(400, 'Số tiền giao dịch không khớp với đơn hàng.')
  }

  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid'
    order.statusHistory.push({
      to: order.orderStatus,
      changedBy: order.customerId,
      changedByRole: 'customer',
      note: 'Thanh toán thành công qua VNPAY',
      changedAt: new Date(),
    })
    await order.save()

    sendOrderConfirmationEmail(order).catch(err =>
      console.error('❌ Error sending payment confirmation email:', err)
    )
  }

  return orderRepository.findOrderById(orderId) as Promise<OrderDetail>
}

/**
 * Xử lý Webhook IPN Server-to-Server từ VNPAY
 */
export const processVnpayIpn = async (vnpayParams: any): Promise<{ RspCode: string; Message: string }> => {
  try {
    const isValidSignature = verifyVnpaySignature(vnpayParams)
    if (!isValidSignature) {
      console.error('❌ VNPAY IPN Checksum Error')
      return { RspCode: '97', Message: 'Invalid Checksum' }
    }

    const orderId = vnpayParams.vnp_TxnRef
    const responseCode = vnpayParams.vnp_ResponseCode
    const vnpAmount = Number(vnpayParams.vnp_Amount)

    const order = await Order.findById(orderId)
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' }
    }

    const expectedAmount = Math.round(order.pricing.grandTotal * 100)
    if (vnpAmount !== expectedAmount) {
      return { RspCode: '04', Message: 'Invalid amount' }
    }

    if (order.paymentStatus === 'paid') {
      return { RspCode: '02', Message: 'Order already confirmed' }
    }

    if (responseCode === '00') {
      order.paymentStatus = 'paid'
      order.statusHistory.push({
        to: order.orderStatus,
        changedBy: order.customerId,
        changedByRole: 'customer',
        note: 'Xác nhận IPN thanh toán VNPAY thành công',
        changedAt: new Date(),
      })
      await order.save()

      sendOrderConfirmationEmail(order).catch(err =>
        console.error('❌ Error sending IPN payment confirmation email:', err)
      )

      return { RspCode: '00', Message: 'Confirm Success' }
    } else {
      return { RspCode: '00', Message: 'Payment failed reported' }
    }
  } catch (error) {
    console.error('❌ Error processing VNPAY IPN:', error)
    return { RspCode: '99', Message: 'Unknown error' }
  }
}
