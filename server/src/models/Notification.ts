import mongoose, { Document, Schema } from 'mongoose'

export type NotificationType = 'order_status' | 'system' | 'promotion'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  content: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['order_status', 'system', 'promotion'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
