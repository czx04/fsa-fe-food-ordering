import type {
  RecommendationEventPayload,
  RecommendationResponse,
} from '../types/recommendation'
import { api } from '../utils/api'

const getMenuItems = async (limit = 4): Promise<RecommendationResponse> => {
  const response = await api.get<RecommendationResponse>('/recommendations/menu-items', {
    params: { limit },
  })
  return response.data
}

const trackEvent = async (payload: RecommendationEventPayload): Promise<void> => {
  await api.post('/recommendations/events', {
    eventId: crypto.randomUUID(),
    ...payload,
  })
}

export const recommendationService = {
  getMenuItems,
  trackEvent,
}
