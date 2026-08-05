import mongoose, { Schema, Document } from 'mongoose'

export interface ICartItem {
  menuItemId: mongoose.Types.ObjectId
  quantity: number
  price: number // Ghi nhận giá tại thời điểm thêm vào giỏ
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId // Giỏ hàng thường giới hạn trong 1 nhà hàng
  items: ICartItem[]
  createdAt: Date
  updatedAt: Date
}

const cartItemSchema = new Schema<ICartItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
})

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
)

export const Cart = mongoose.model<ICart>('Cart', cartSchema)
