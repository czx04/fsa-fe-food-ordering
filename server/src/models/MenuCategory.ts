import mongoose, { Schema, Document } from 'mongoose'

export interface IMenuCategory extends Document {
  restaurantId: mongoose.Types.ObjectId
  name: string
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
menuCategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } })

export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', menuCategorySchema)
