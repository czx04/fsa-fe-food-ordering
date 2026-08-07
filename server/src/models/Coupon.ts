import mongoose, { Document, Schema } from 'mongoose'

export type DiscountType = 'percentage' | 'fixed'
export type CouponStatus = 'active' | 'expired' | 'disabled'

export interface ICoupon extends Document {
  code: string
  discountType: DiscountType
  discountValue: number
  startsAt: Date
  endsAt: Date
  status: CouponStatus
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'disabled'], default: 'active' },
  },
  {
    timestamps: true,
  }
)

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema)

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  orderId: mongoose.Types.ObjectId
  status: string
  createdAt: Date
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    status: { type: String, default: 'applied' },
  },
  {
    timestamps: true,
  }
)

export const CouponUsage = mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema)
