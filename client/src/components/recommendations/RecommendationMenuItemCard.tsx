import { useEffect, useRef } from 'react'

import { MenuItemCard } from '../cards/MenuItemCard'
import { recommendationService } from '../../services/recommendationService'
import type { RecommendedMenuItem, RecommendationMeta } from '../../types/recommendation'

interface RecommendationMenuItemCardProps {
  item: RecommendedMenuItem
  meta: RecommendationMeta
  position: number
  onAddToCart: (item: RecommendedMenuItem) => void
}

export const RecommendationMenuItemCard = ({
  item,
  meta,
  position,
  onAddToCart,
}: RecommendationMenuItemCardProps) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const impressionTrackedRef = useRef(false)

  const track = (eventType: 'impression' | 'click') => {
    void recommendationService.trackEvent({
      requestId: meta.requestId,
      algorithmVersion: meta.algorithmVersion,
      surface: 'home',
      eventType,
      menuItemId: item._id,
      position,
    }).catch(() => undefined)
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (impressionTrackedRef.current || !entries.some((entry) => entry.isIntersecting)) return
        impressionTrackedRef.current = true
        track('impression')
        observer.disconnect()
      },
      { threshold: 0.5 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [item._id, meta.algorithmVersion, meta.requestId, position])

  return (
    <div ref={elementRef}>
      <MenuItemCard
        item={item}
        reasonLabel={item.reasonLabel}
        onItemClick={() => track('click')}
        onAddToCart={() => onAddToCart(item)}
      />
    </div>
  )
}
