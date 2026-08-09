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
    subtotal: number
    discountAmount: number
    grandTotal: number
    createdAt: Date
    updatedAt: Date
    couponId?: mongoose.Types.ObjectId | null
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
        subtotal: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, required: true, default: 0 },
        grandTotal: { type: Number, required: true, default: 0 },
        couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    },
    { timestamps: true }
)

export const Cart = mongoose.model<ICart>('Cart', cartSchema)
