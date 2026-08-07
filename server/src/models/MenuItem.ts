import mongoose, { Schema, Document } from 'mongoose'

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId
  menuCategoryId: mongoose.Types.ObjectId
  name: string
  slug?: string
  shortDescription?: string
  description?: string
  ingredients: string[]
  imageUrls: string[]
  basePrice?: number
  salePrice?: number | null
  price?: number
  imageUrl?: string
  isAvailable: boolean
  isVisible: boolean
  soldCount: number
  optionGroups: Array<{
    name: string
    minSelect: number
    maxSelect: number
    required: boolean
    options: Array<{ name: string; priceDelta: number; isAvailable: boolean }>
  }>
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const optionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    priceDelta: { type: Number, min: 0, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true }
)

const optionGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    minSelect: { type: Number, min: 0, default: 0 },
    maxSelect: { type: Number, min: 1, default: 1 },
    required: { type: Boolean, default: false },
    options: { type: [optionSchema], default: [] },
  },
  { _id: true }
)

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    menuCategoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    shortDescription: { type: String, trim: true },
    description: { type: String },
    ingredients: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
    basePrice: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    price: { type: Number, min: 0 },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
    optionGroups: { type: [optionGroupSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

menuItemSchema.index(
  { restaurantId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' }, deletedAt: null } }
)
menuItemSchema.index({ restaurantId: 1, menuCategoryId: 1, isVisible: 1, deletedAt: 1 })

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema)
