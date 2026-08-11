import mongoose, { Document, Schema } from 'mongoose'

export type RecommendationEventType = 'impression' | 'click' | 'add_to_cart'

export interface IRecommendationEvent extends Document {
  eventId: string
  requestId: string
  algorithmVersion: string
  surface: 'home'
  eventType: RecommendationEventType
  userId: mongoose.Types.ObjectId
  menuItemId: mongoose.Types.ObjectId
  restaurantId: mongoose.Types.ObjectId
  position: number
  createdAt: Date
}

const recommendationEventSchema = new Schema<IRecommendationEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    requestId: { type: String, required: true },
    algorithmVersion: { type: String, required: true },
    surface: { type: String, enum: ['home'], required: true },
    eventType: { type: String, enum: ['impression', 'click', 'add_to_cart'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    position: { type: Number, required: true, min: 1, max: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

recommendationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })
recommendationEventSchema.index({ userId: 1, requestId: 1, eventType: 1 })
recommendationEventSchema.index({ algorithmVersion: 1, eventType: 1, createdAt: -1 })

export const RecommendationEvent = mongoose.model<IRecommendationEvent>(
  'RecommendationEvent',
  recommendationEventSchema,
)
