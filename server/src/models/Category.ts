import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  name: string
  imageUrl?: string
  description?: string
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Category = mongoose.model<ICategory>('Category', categorySchema)
