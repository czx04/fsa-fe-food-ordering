import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId
  name: string // Sao chép tên và giá để phòng trường hợp món ăn bị đổi giá/tên sau này
  price: number
  quantity: number
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  items: IOrderItem[]
  totalAmount: number
  shippingAddress: string
  status: 'pending' | 'accepted' | 'shipping' | 'completed' | 'cancelled'
  paymentMethod: 'cash' | 'card' | 'wallet'
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
})

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'shipping', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export const Order = mongoose.model<IOrder>('Order', orderSchema)
