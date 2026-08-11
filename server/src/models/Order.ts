import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItemSnapshot {
  menuItemId: mongoose.Types.ObjectId
  name: string
  imageUrl?: string | null
  quantity: number
  baseUnitPrice: number
  selectedOptions: Array<{
    groupId: mongoose.Types.ObjectId
    optionId: mongoose.Types.ObjectId
    groupName: string
    optionName: string
    priceDelta: number
  }>
  finalUnitPrice: number
  lineTotal: number
  note?: string | null
}

export interface IStatusHistory {
  from?: string | null
  to: string
  changedBy: mongoose.Types.ObjectId
  changedByRole: 'customer' | 'restaurant_owner' | 'admin' | 'system'
  reason?: string | null
  note?: string | null
  changedAt: Date
}

export interface IOrder extends Document {
  orderNumber: string
  checkoutKey: string
  customerId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
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
    location?: { type: 'Point'; coordinates: [number, number] } | null
    note?: string | null
  }
  items: IOrderItemSnapshot[]
  couponId?: mongoose.Types.ObjectId | null
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
  statusHistory: IStatusHistory[]
  cancellation?: {
    cancelledBy: mongoose.Types.ObjectId
    reason: string
    cancelledAt: Date
  } | null
  placedAt: Date
  confirmedAt?: Date | null
  deliveredAt?: Date | null
  cancelledAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const selectedOptionSnapshotSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, required: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
    groupName: { type: String, required: true },
    optionName: { type: String, required: true },
    priceDelta: { type: Number, required: true },
  },
  { _id: false }
)

const orderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    baseUnitPrice: { type: Number, required: true, min: 0 },
    selectedOptions: [selectedOptionSnapshotSchema],
    finalUnitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    note: { type: String, default: null },
  },
  { _id: false }
)

const statusHistorySchema = new Schema<IStatusHistory>(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, required: true },
    changedByRole: {
      type: String,
      enum: ['customer', 'restaurant_owner', 'admin', 'system'],
      required: true,
    },
    reason: { type: String, default: null },
    note: { type: String, default: null },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
)

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    checkoutKey: { type: String, required: true }, // Should be unique with customerId
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customerSnapshot: { type: Schema.Types.Mixed, required: true },
    restaurantSnapshot: { type: Schema.Types.Mixed, required: true },
    recipient: { type: Schema.Types.Mixed, required: true },
    items: { type: [orderItemSnapshotSchema], required: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponSnapshot: { type: Schema.Types.Mixed, default: null },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      deliveryFee: { type: Number, required: true, min: 0 },
      discountAmount: { type: Number, required: true, min: 0 },
      grandTotal: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, default: 'VND' },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'vnpay', 'momo', 'stripe', 'mock'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'],
      required: true,
      default: 'pending',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    cancellation: { type: Schema.Types.Mixed, default: null },
    placedAt: { type: Date, required: true, default: Date.now },
    confirmedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
)

orderSchema.index({ customerId: 1, checkoutKey: 1 }, { unique: true })
orderSchema.index({ customerId: 1, createdAt: -1 })
orderSchema.index({ customerId: 1, orderStatus: 1, placedAt: -1 })
orderSchema.index({ restaurantId: 1, orderStatus: 1, createdAt: -1 })
orderSchema.index({ restaurantId: 1, paymentStatus: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1, orderStatus: 1 })

export const Order = mongoose.model<IOrder>('Order', orderSchema)
