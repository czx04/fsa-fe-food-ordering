import { Request } from 'express'
import { Types } from 'mongoose'
import { AuditLog } from '../models/AuditLog.js'
import type { UserRole } from '../models/User.js'

export type DashboardGranularity = 'day' | 'month' | 'year'

const dashboardDateFormats: Record<DashboardGranularity, string> = {
  day: '%Y-%m-%d',
  month: '%Y-%m',
  year: '%Y',
}

export const dashboardGranularityFrom = (query: Record<string, unknown>): DashboardGranularity =>
  query.granularity === 'month' || query.granularity === 'year' ? query.granularity : 'day'

export const dashboardDateFormat = (granularity: DashboardGranularity) => dashboardDateFormats[granularity]

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const paginationFrom = (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  return { page, limit, skip: (page - 1) * limit }
}

export const paginationMeta = (page: number, limit: number, totalItems: number) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
})

export const dateRangeFrom = (query: Record<string, unknown>, fallbackDays = 30) => {
  const now = new Date()
  const to = typeof query.to === 'string' && query.to ? new Date(`${query.to}T23:59:59.999Z`) : now
  const from = typeof query.from === 'string' && query.from
    ? new Date(`${query.from}T00:00:00.000Z`)
    : new Date(to.getTime() - (fallbackDays - 1) * 86_400_000)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new Error('Khoảng ngày không hợp lệ.')
  }
  const duration = to.getTime() - from.getTime() + 1
  const previousTo = new Date(from.getTime() - 1)
  const previousFrom = new Date(previousTo.getTime() - duration + 1)
  return { from, to, previousFrom, previousTo }
}

export const metric = (current: number, previous: number) => ({
  current,
  previous,
  changePercent: previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10,
})

export const toObjectId = (value: string) => new Types.ObjectId(value)

export const recordAudit = async ({
  request,
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  reason,
  before,
  after,
}: {
  request: Request
  actorId: string
  actorRole: UserRole
  action: string
  entityType: string
  entityId: string
  reason?: string | null
  before?: unknown
  after?: unknown
}) => {
  await AuditLog.create({
    actorId: toObjectId(actorId),
    actorRole,
    action,
    entityType,
    entityId,
    reason: reason || null,
    before: before ?? null,
    after: after ?? null,
    ip: request.ip || null,
    userAgent: request.get('user-agent') || null,
  })
}
