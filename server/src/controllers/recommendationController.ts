import { NextFunction, Response } from 'express'

import { AuthRequest } from '../middlewares/authMiddleware.js'
import {
  getMenuItemRecommendations,
  trackRecommendationEvent,
  type TrackRecommendationEventPayload,
} from '../services/recommendationService.js'

export const getMenuItemRecommendationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = Number(req.query.limit ?? 4)
    res.status(200).json(await getMenuItemRecommendations(req.user!.userId, limit))
  } catch (error) {
    next(error)
  }
}

export const trackRecommendationEventHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await trackRecommendationEvent(req.user!.userId, req.body as TrackRecommendationEventPayload)
    res.status(202).send()
  } catch (error) {
    next(error)
  }
}
