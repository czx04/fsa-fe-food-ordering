import mongoose, { Document, Schema } from 'mongoose'

export type EmailJobStatus = 'pending' | 'sent' | 'failed'

export interface IEmailJob extends Document {
  orderId?: mongoose.Types.ObjectId | null
  userId?: mongoose.Types.ObjectId | null
  recipient: string
  template: string
  payload: Record<string, any>
  status: EmailJobStatus
  attempts: number
  errorDetails?: string | null
  createdAt: Date
  updatedAt: Date
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    recipient: { type: String, required: true, trim: true },
    template: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    errorDetails: { type: String, default: null },
  },
  {
    timestamps: true,
  }
)

EmailJobSchema.index({ status: 1, createdAt: 1 })

export const EmailJob = mongoose.model<IEmailJob>('EmailJob', EmailJobSchema)
