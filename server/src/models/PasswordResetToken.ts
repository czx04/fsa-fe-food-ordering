import mongoose, { Document, Schema } from 'mongoose'

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  usedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

PasswordResetTokenSchema.index({ userId: 1, expiresAt: 1 })

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema
)
