import mongoose, { Document, Schema } from 'mongoose'

export type UserRole = 'customer' | 'restaurant_owner' | 'admin'
export type UserStatus = 'active' | 'locked' | 'pending_verification'

export interface IUserAddress {
  _id?: mongoose.Types.ObjectId
  label: string
  recipientName: string
  phone: string
  line1: string
  ward: string
  district: string
  city: string
  location?: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  isDefault: boolean
}

export interface IUser extends Document {
  fullName: string
  email: string
  phone: string
  passwordHash: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string | null
  dateOfBirth?: Date | null
  emailVerifiedAt?: Date | null
  emailVerificationToken?: string | null
  emailVerificationExpires?: Date | null
  termsAcceptedAt: Date
  failedLoginCount: number
  lockedUntil?: Date | null
  lastLoginAt?: Date | null
  refreshTokens: string[]
  addresses: IUserAddress[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

const AddressSchema = new Schema<IUserAddress>(
  {
    label: { type: String, required: true },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    ward: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: false },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
)

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: {
      type: String,
      required: true,
      select: false, // BẢO MẬT: Ẩn mặc định khi query
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant_owner', 'admin'],
      default: 'customer',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'pending_verification'],
      default: 'pending_verification',
      required: true,
    },
    avatarUrl: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
    termsAcceptedAt: { type: Date, default: Date.now },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    refreshTokens: {
      type: [String],
      default: [],
      select: false, // BẢO MẬT: Ẩn mặc định khi query
    },
    addresses: { type: [AddressSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

// Index cho tìm kiếm và lọc cơ bản
UserSchema.index({ role: 1, status: 1 })
// Index hỗ trợ tìm kiếm khoảng cách theo địa chỉ
UserSchema.index({ 'addresses.location': '2dsphere' })

export const User = mongoose.model<IUser>('User', UserSchema)