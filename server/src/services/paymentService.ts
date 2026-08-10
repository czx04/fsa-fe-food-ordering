import createError from 'http-errors';
import { Order } from '../models/Order.js';
import * as orderRepository from '../repositories/orderRepository.js';
import { OrderDetail } from '../types/order.js';

/**
 * Xác thực URL trả về từ giao dịch VNPAY.
 * Trong thực tế, bước này sẽ bao gồm việc xác thực chữ ký điện tử (cryptographic signature).
 * Ở đây, chúng ta sẽ kiểm tra mã phản hồi và trạng thái đơn hàng.
 * @param vnpayParams - Các query parameter được VNPAY trả về.
 * @returns Chi tiết đơn hàng đã được xác thực.
 */
export const verifyVnpayReturn = async (vnpayParams: any): Promise<OrderDetail> => {
  const orderId = vnpayParams.vnp_TxnRef;
  const responseCode = vnpayParams.vnp_ResponseCode;
  const isMock = vnpayParams.mock === 'true';

  if (!orderId) {
    throw createError(400, 'Thông tin giao dịch không hợp lệ.');
  }

  // Trong ứng dụng thực tế, bạn sẽ xác thực vnp_SecureHash ở đây để chống giả mạo.

  if (responseCode !== '00') {
    // Thanh toán thất bại tại cổng thanh toán.
    throw createError(400, 'Giao dịch thanh toán thất bại tại cổng thanh toán.');
  }

  // Kiểm tra đơn hàng trong DB. Webhook lẽ ra đã cập nhật trạng thái của nó.
  const order = await Order.findById(orderId);

  if (!order) {
    throw createError(404, 'Không tìm thấy đơn hàng tương ứng với giao dịch.');
  }

  // Nếu là giao dịch giả lập và thanh toán thành công, cập nhật trạng thái trực tiếp.
  // Điều này mô phỏng công việc của webhook.
  if (isMock && order.paymentStatus !== 'paid' && responseCode === '00') {
    order.paymentStatus = 'paid';
    await order.save();
  }

  // Webhook/IPN là nguồn tin cậy duy nhất cho trạng thái thanh toán.
  // Chúng ta kiểm tra xem paymentStatus có phải là 'paid' không. Nếu vẫn là 'unpaid', có thể webhook bị trễ.
  if (order.paymentStatus !== 'paid') {
    throw createError(400, 'Trạng thái thanh toán của đơn hàng chưa được xác nhận. Vui lòng chờ và kiểm tra lại trong Lịch sử đơn hàng.');
  }

  // Nếu mọi thứ ổn, trả về chi tiết đơn hàng.
  return orderRepository.findOrderById(orderId) as Promise<OrderDetail>;
};
