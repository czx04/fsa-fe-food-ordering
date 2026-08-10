import { Order } from "../models/Order.js";
import { env } from "../config/env.js";

/**
 * Tạo URL thanh toán cho VNPAY.
 * Chuyển đổi giữa việc triển khai thật và giả lập dựa trên biến môi trường.
 * @param order - Đối tượng đơn hàng từ Mongoose.
 * @param req - Đối tượng request (để lấy IP, v.v. trong trường hợp thật).
 * @returns Một chuỗi URL thanh toán.
 */
export const createVnpayPaymentUrl = (order: any, req: any): string => {
  if (env.VNPAY_MODE === "mock") {
    return createMockVnpayUrl(order);
  }
  return createRealVnpayUrl(order, req);
};

/**
 * Tạo URL VNPAY giả lập cho mục đích kiểm thử.
 * Nó chuyển hướng trực tiếp đến các trang thành công/thất bại của frontend.
 */
const createMockVnpayUrl = (order: any): string => {
  const baseUrl = env.CLIENT_URL || "http://localhost:5173";

  // Logic đơn giản để mô phỏng thành công hoặc thất bại để kiểm thử
  // Ví dụ: thành công nếu tổng tiền là số chẵn (tính theo nghìn đồng)
  const isSuccess = Math.floor(order.pricing.grandTotal / 1000) % 2 === 0;

  if (isSuccess) {
    const successParams = new URLSearchParams({
      vnp_TxnRef: order._id.toString(),
      vnp_ResponseCode: "00",
      mock: "true", // Cờ để frontend và backend nhận biết đây là giao dịch giả
      vnp_Amount: (order.pricing.grandTotal * 100).toString(),
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber} (mock)`,
    });
    return `${baseUrl}/payment/success?${successParams.toString()}`;
  } else {
    const failureParams = new URLSearchParams({
      reason: "Giao dịch bị từ chối (mock).",
      orderId: order._id.toString(),
    });
    return `${baseUrl}/payment/failed?${failureParams.toString()}`;
  }
};

/**
 * Tạo URL VNPAY thật bằng SDK.
 */
const createRealVnpayUrl = (order: any, req: any): string => {
  // Logic tích hợp SDK VNPAY thật sẽ nằm ở đây.
  throw new Error("Chức năng tạo URL VNPAY thật chưa được triển khai.");
};
