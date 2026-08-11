export type RecommendationReasonCode =
  | 'ordered_before'
  | 'favorite_restaurant'
  | 'favorite_cuisine'
  | 'trending'

export interface RecommendationSignals {
  itemAffinity: number
  restaurantAffinity: number
  cuisineAffinity: number
  priceFit: number
  trendAffinity: number
  rating: number
}

export interface ScoredRecommendation extends RecommendationSignals {
  itemId: string
  restaurantId: string
  score: number
  reasonCode: RecommendationReasonCode
  reasonLabel: string
  orderedBefore: boolean
}

const reasonLabels: Record<RecommendationReasonCode, string> = {
  ordered_before: 'Bạn từng đặt món này',
  favorite_restaurant: 'Từ quán bạn yêu thích',
  favorite_cuisine: 'Hợp gu ẩm thực của bạn',
  trending: 'Đang được nhiều người chọn',
}

export const recencyWeight = (placedAt: Date, now = new Date()) => {
  const ageDays = Math.max(0, (now.getTime() - placedAt.getTime()) / (24 * 60 * 60 * 1_000))
  return Math.pow(0.5, ageDays / 90)
}

export const normalizeAffinityMap = (values: Map<string, number>) => {
  const max = Math.max(0, ...values.values())
  if (max === 0) return new Map([...values.keys()].map((key) => [key, 0]))
  return new Map([...values.entries()].map(([key, value]) => [key, value / max]))
}

export const normalizeAndApplyAffinityMultipliers = (
  values: Map<string, number>,
  multipliers: Map<string, number>,
) => new Map(
  [...normalizeAffinityMap(values)].map(([key, value]) => [key, value * (multipliers.get(key) ?? 1)]),
)

export const calculatePriceFit = (price: number, medianPrice: number | null) => {
  if (!medianPrice || medianPrice <= 0) return 0.5
  return Math.max(0, 1 - Math.min(1, Math.abs(price - medianPrice) / medianPrice))
}

export const reviewAffinityMultiplier = (averageRating: number | undefined) => {
  if (averageRating === undefined) return 1
  if (averageRating >= 4) return 1.15
  if (averageRating >= 3) return 1
  return 0.5
}

export const scoreRecommendation = (
  itemId: string,
  restaurantId: string,
  signals: RecommendationSignals,
): ScoredRecommendation => {
  const score =
    signals.itemAffinity * 0.4 +
    signals.restaurantAffinity * 0.2 +
    signals.cuisineAffinity * 0.15 +
    signals.priceFit * 0.1 +
    signals.trendAffinity * 0.1 +
    signals.rating * 0.05

  const reasonCode: RecommendationReasonCode = signals.itemAffinity > 0
    ? 'ordered_before'
    : signals.restaurantAffinity > 0
      ? 'favorite_restaurant'
      : signals.cuisineAffinity > 0
        ? 'favorite_cuisine'
        : 'trending'

  return {
    itemId,
    restaurantId,
    ...signals,
    score,
    reasonCode,
    reasonLabel: reasonLabels[reasonCode],
    orderedBefore: signals.itemAffinity > 0,
  }
}

export const selectDiverseRecommendations = <T extends ScoredRecommendation>(
  candidates: T[],
  limit: number,
  maxPerRestaurant = 2,
) => {
  const sorted = [...candidates].sort((left, right) =>
    right.score - left.score || left.itemId.localeCompare(right.itemId),
  )
  const selected: T[] = []
  const restaurantCounts = new Map<string, number>()

  for (const candidate of sorted) {
    if ((restaurantCounts.get(candidate.restaurantId) ?? 0) >= maxPerRestaurant) continue
    selected.push(candidate)
    restaurantCounts.set(candidate.restaurantId, (restaurantCounts.get(candidate.restaurantId) ?? 0) + 1)
    if (selected.length === limit) break
  }

  if (selected.length > 1 && selected.every((candidate) => candidate.orderedBefore)) {
    const exploration = sorted.find((candidate) =>
      !candidate.orderedBefore && !selected.some((current) => current.itemId === candidate.itemId),
    )
    if (exploration) {
      const removed = selected[selected.length - 1]!
      const explorationRestaurantCount = restaurantCounts.get(exploration.restaurantId) ?? 0
      const effectiveCount = exploration.restaurantId === removed.restaurantId
        ? explorationRestaurantCount - 1
        : explorationRestaurantCount
      if (effectiveCount < maxPerRestaurant) selected[selected.length - 1] = exploration
    }
  }

  return selected.sort((left, right) => right.score - left.score || left.itemId.localeCompare(right.itemId))
}
