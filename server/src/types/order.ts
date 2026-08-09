export interface OrderSummary {
  _id: string
  orderNumber: string
  placedAt: string
  restaurantSnapshot: {
    name: string
  }
  pricing: {
    grandTotal: number
  }
  orderStatus: string
  items: Array<{
    name: string
    quantity: number
  }>
}

export interface OrderHistoryPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  limit: number
}

export interface OrderHistoryResponse {
  data: OrderSummary[]
  pagination: OrderHistoryPagination
  totalPages: number
  total: number
  limit: number
}

export interface OrderItemOption {
  groupId: string
  optionId: string
  groupName: string
  optionName: string
  priceDelta: number
}

export interface OrderItem {
  menuItemId: string
  name: string
  imageUrl?: string | null
  quantity: number
  baseUnitPrice: number
  selectedOptions: OrderItemOption[]
  finalUnitPrice: number
  lineTotal: number
  note?: string | null
}

export interface OrderDetail extends OrderSummary {
  checkoutKey: string
  customerId: string
  restaurantId: string
  customerSnapshot: {
    fullName: string
    email: string
    phone: string
  }
  restaurantSnapshot: {
    name: string
    phone: string
    logoUrl?: string | null
    addressText: string
  }
  recipient: {
    fullName: string
    phone: string
    addressText: string
    ward: string
    district: string
    city: string
    location?: {
      type: 'Point'
      coordinates: [number, number]
    } | null
    note?: string | null
  }
  items: OrderItem[]
  couponId?: string | null
  couponSnapshot?: {
    code: string
    name: string
    discountType: 'fixed' | 'percentage'
    discountValue: number
  } | null
  pricing: {
    subtotal: number
    deliveryFee: number
    discountAmount: number
    grandTotal: number
    currency: 'VND'
  }
  paymentMethod: 'cod' | 'vnpay' | 'momo' | 'stripe' | 'mock'
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled'
  statusHistory: Array<{
    from?: string | null
    to: string
    changedBy: string
    changedByRole: 'customer' | 'restaurant_owner' | 'admin' | 'system'
    reason?: string | null
    note?: string | null
    changedAt: string
  }>
  cancellation?: {
    cancelledBy: string
    reason: string
    cancelledAt: string
  } | null
  confirmedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO';
  deliveryAddress: {
    recipientName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    city: string;
  };
  note?: string;
}

export interface CancelOrderPayload {
  reason: string;
  note?: string;
}

export interface CancelOrderResponse {
  message: string;
  order: OrderDetail;
}
