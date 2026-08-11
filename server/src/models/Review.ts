import mongoose, { Document, Schema } from 'mongoose'

export type ReviewVisibility = 'visible' | 'hidden' | 'flagged'

export interface IReviewOwnerReply {
  content: string
  createdAt: Date
}

export interface IReview extends Document {
  orderId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  rating: number
  content: string
  imageUrls: string[]
  ownerReply?: IReviewOwnerReply | null
  visibilityStatus: ReviewVisibility
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

const ReviewSchema = new Schema<IReview>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true },
    imageUrls: { type: [String], default: [] },
    ownerReply: {
      content: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
    },
    visibilityStatus: {
      type: String,
      enum: ['visible', 'hidden', 'flagged'],
      default: 'visible',
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

ReviewSchema.index({ restaurantId: 1, visibilityStatus: 1, createdAt: -1 })
ReviewSchema.index({ restaurantId: 1, rating: -1, createdAt: -1 })
ReviewSchema.index({ customerId: 1 })
ReviewSchema.index(
  { orderId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
)

export const Review = mongoose.model<IReview>('Review', ReviewSchema)
