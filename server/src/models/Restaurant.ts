import mongoose, { Schema, Document } from 'mongoose'

export interface IRestaurant extends Document {
  ownerId: mongoose.Types.ObjectId
  name: string
  address: string
  phone: string
  coverImage?: string
  rating: number
  openTime: string // e.g. "08:00"
  closeTime: string // e.g. "22:00"
  isActive: boolean
  cuisineCategoryIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    coverImage: { type: String },
    rating: { type: Number, default: 0 },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    cuisineCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'CuisineCategory' }],
  },
  { timestamps: true }
)

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema)
