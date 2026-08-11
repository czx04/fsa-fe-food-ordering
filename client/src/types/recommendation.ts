import type { MenuItemCardData } from '../components/cards/MenuItemCard'

export type RecommendationReasonCode =
  | 'ordered_before'
  | 'favorite_restaurant'
  | 'favorite_cuisine'
  | 'trending'

export interface RecommendedMenuItem extends MenuItemCardData {
  reasonCode: RecommendationReasonCode
  reasonLabel: string
}

export interface RecommendationMeta {
  requestId: string
  algorithmVersion: string
  strategy: 'history-hybrid' | 'trending'
  personalized: boolean
  generatedAt: string
}

export interface RecommendationResponse {
  data: RecommendedMenuItem[]
  meta: RecommendationMeta
}

export type RecommendationEventType = 'impression' | 'click' | 'add_to_cart'

export interface RecommendationEventPayload {
  requestId: string
  algorithmVersion: string
  surface: 'home'
  eventType: RecommendationEventType
  menuItemId: string
  position: number
}
