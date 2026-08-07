export interface OrderItemOption {
  optionName: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  lineTotal: number;
  selectedOptions: OrderItemOption[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  placedAt: string;
  restaurantSnapshot?: {
    name: string;
  };
  pricing: {
    grandTotal: number;
  };
  orderStatus: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  recipient: {
    fullName: string;
    phone: string;
    addressText: string;
    note?: string;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    grandTotal: number;
  };
  couponSnapshot?: {
    code: string;
  };
  paymentMethod: "cod" | string;
  statusHistory: {
    to: string;
    changedAt: string;
  }[];
}

export interface CreateOrderPayload {
  paymentMethod: "COD" | "ONLINE";
  // Backend sẽ tự động lấy giỏ hàng của user để tạo đơn hàng
}
