import mongoose, { Schema, Document } from 'mongoose'

export interface ICuisineCategory extends Document {
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const cuisineCategorySchema = new Schema<ICuisineCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'cuisineCategories',
  }
)

cuisineCategorySchema.index({ isActive: 1, displayOrder: 1 })

export const CuisineCategory = mongoose.model<ICuisineCategory>('CuisineCategory', cuisineCategorySchema)
