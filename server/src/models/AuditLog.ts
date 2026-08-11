import mongoose, { Document, Schema } from 'mongoose'
import type { UserRole } from './User.js'

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId
  actorRole: UserRole
  action: string
  entityType: string
  entityId: string
  reason?: string | null
  before?: unknown
  after?: unknown
  ip?: string | null
  userAgent?: string | null
  createdAt: Date
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['customer', 'restaurant_owner', 'admin'], required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true },
    reason: { type: String, default: null, trim: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true },
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ actorId: 1, createdAt: -1 })
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, createdAt: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)
