import mongoose, { Schema, Document } from 'mongoose'

export interface IMenuCategory extends Document {
  restaurantId: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string | null
  displayOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'menuCategories',
  }
)

menuCategorySchema.index({ restaurantId: 1, displayOrder: 1 })
const uniqueValidator = { unique: true, partialFilterExpression: { deletedAt: null } }
menuCategorySchema.index({ restaurantId: 1, name: 1 }, uniqueValidator)
menuCategorySchema.index({ restaurantId: 1, slug: 1 }, uniqueValidator)

export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', menuCategorySchema)
