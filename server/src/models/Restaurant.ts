import mongoose, { Schema, Document } from 'mongoose'

export interface IOpeningSlot {
  open: string
  close: string
}

export interface IOpeningHours {
  dayOfWeek: number
  isClosed: boolean
  slots: IOpeningSlot[]
}

export interface IRestaurantAddress {
  line1: string
  ward: string
  district: string
  city: string
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface IRestaurant extends Document {
  ownerId: mongoose.Types.ObjectId
  cuisineCategoryIds: mongoose.Types.ObjectId[]
  name: string
  slug: string
  description: string
  logoUrl?: string | null
  coverUrl?: string | null
  galleryUrls: string[]
  phone: string
  address: IRestaurantAddress
  openingHours: IOpeningHours[]
  delivery: {
    fee: number
    minMinutes: number
    maxMinutes: number
    maxDistanceKm?: number | null
  }
  priceRange: 'budget' | 'mid' | 'premium'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  operationStatus: 'open' | 'temporarily_closed' | 'suspended'
  rejectionReason?: string | null
  ratingSummary: {
    average: number
    count: number
    distribution: Record<'1' | '2' | '3' | '4' | '5', number>
  }
  stats: {
    completedOrderCount: number
    totalItemSold: number
  }
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const openingSlotSchema = new Schema<IOpeningSlot>(
  {
    open: { type: String, required: true },
    close: { type: String, required: true },
  },
  { _id: false }
)

const openingHoursSchema = new Schema<IOpeningHours>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isClosed: { type: Boolean, default: false },
    slots: { type: [openingSlotSchema], default: [] },
  },
  { _id: false }
)

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cuisineCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'CuisineCategory' }],
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: null, trim: true },
    coverUrl: { type: String, default: null, trim: true },
    galleryUrls: { type: [String], default: [] },
    phone: { type: String, required: true, trim: true },
    address: {
      line1: { type: String, required: true, trim: true },
      ward: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: {
          type: [Number],
          validate: {
            validator: (value: number[]) => value.length === 2,
            message: 'location.coordinates phải gồm [lng, lat]',
          },
        },
      },
    },
    openingHours: { type: [openingHoursSchema], default: [] },
    delivery: {
      fee: { type: Number, required: true, min: 0, default: 0 },
      minMinutes: { type: Number, required: true, min: 0 },
      maxMinutes: { type: Number, required: true, min: 0 },
      maxDistanceKm: { type: Number, min: 0, default: null },
    },
    priceRange: {
      type: String,
      enum: ['budget', 'mid', 'premium'],
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    operationStatus: {
      type: String,
      enum: ['open', 'temporarily_closed', 'suspended'],
      default: 'open',
    },
    rejectionReason: { type: String, default: null },
    ratingSummary: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
      distribution: {
        '1': { type: Number, min: 0, default: 0 },
        '2': { type: Number, min: 0, default: 0 },
        '3': { type: Number, min: 0, default: 0 },
        '4': { type: Number, min: 0, default: 0 },
        '5': { type: Number, min: 0, default: 0 },
      },
    },
    stats: {
      completedOrderCount: { type: Number, min: 0, default: 0 },
      totalItemSold: { type: Number, min: 0, default: 0 },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

restaurantSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: 'string' } },
  }
)
restaurantSchema.index({ cuisineCategoryIds: 1, approvalStatus: 1, operationStatus: 1 })
restaurantSchema.index({ 'ratingSummary.average': -1, createdAt: -1 })
restaurantSchema.index({ 'address.city': 1, 'address.district': 1 })
restaurantSchema.index({ 'address.location': '2dsphere' })

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema)
