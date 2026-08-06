import mongoose, { Document, Schema } from 'mongoose'

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
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: null, trim: true },
    imageUrl: { type: String, default: null, trim: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

cuisineCategorySchema.index({ slug: 1 }, { unique: true })
cuisineCategorySchema.index({ isActive: 1, displayOrder: 1 })

export const CuisineCategory = mongoose.model<ICuisineCategory>(
  'CuisineCategory',
  cuisineCategorySchema
)
