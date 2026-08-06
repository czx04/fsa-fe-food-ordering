import mongoose, { Schema, Document } from 'mongoose'

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId
  menuCategoryId: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  soldCount: number
  createdAt: Date
  updatedAt: Date
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    menuCategoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema)
