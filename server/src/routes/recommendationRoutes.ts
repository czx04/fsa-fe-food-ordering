import { Router } from 'express'
import { z } from 'zod'

import {
  getMenuItemRecommendationsHandler,
  trackRecommendationEventHandler,
} from '../controllers/recommendationController.js'
import { requireRole, verifyToken } from '../middlewares/authMiddleware.js'
import { validate } from '../middlewares/validateMiddleware.js'

export const recommendationRouter = Router()

export const recommendationLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(4),
})

export const recommendationEventBodySchema = z.object({
  eventId: z.string().uuid(),
  requestId: z.string().uuid(),
  algorithmVersion: z.string().trim().min(1).max(50),
  surface: z.literal('home'),
  eventType: z.enum(['impression', 'click', 'add_to_cart']),
  menuItemId: z.string().regex(/^[a-f\d]{24}$/i, 'ID món ăn không hợp lệ.'),
  position: z.number().int().min(1).max(100),
}).strict()

recommendationRouter.use(verifyToken)
recommendationRouter.use(requireRole(['customer']))

recommendationRouter.get('/menu-items', validate({
  query: recommendationLimitQuerySchema,
}), getMenuItemRecommendationsHandler)

recommendationRouter.post('/events', validate({
  body: recommendationEventBodySchema,
}), trackRecommendationEventHandler)
