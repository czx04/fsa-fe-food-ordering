import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, Plus, Heart } from 'lucide-react'

export interface MenuItemCardData {
  _id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  imageUrl?: string | null
  price?: number
  basePrice?: number
  salePrice?: number | null
  effectivePrice?: number
  isAvailable?: boolean
  soldCount?: number
  restaurantId?: {
    _id: string
    name: string
    slug: string
    ratingSummary?: {
      average: number
    }
    delivery?: {
      minMinutes: number
      maxMinutes: number
    }
  }
}

interface MenuItemCardProps {
  item: MenuItemCardData
  onAddToCart?: (item: MenuItemCardData) => void
  onItemClick?: (item: MenuItemCardData) => void
  reasonLabel?: string
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

const formatMoney = (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  onItemClick,
  reasonLabel,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [fav, setFav] = useState(isFavorite)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFav((prev) => !prev)
    if (onToggleFavorite) {
      onToggleFavorite(item._id)
    }
  }

  const image = item.imageUrl || '/assets/noodles.jpg'
  const displayPrice = item.effectivePrice ?? item.salePrice ?? item.price ?? item.basePrice ?? 0
  const originalPrice = item.salePrice && item.basePrice ? item.basePrice : null

  const ratingAvg = item.restaurantId?.ratingSummary?.average
  const deliveryTime = item.restaurantId?.delivery
    ? `${item.restaurantId.delivery.minMinutes}–${item.restaurantId.delivery.maxMinutes} phút`
    : null

  const restaurantName = item.restaurantId?.name || 'Nhà hàng'
  const restaurantSlug = item.restaurantId?.slug

  const detailUrl = restaurantSlug
    ? `/restaurants/${restaurantSlug}/menu-items/${item.slug}`
    : '/restaurants'

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Image Header */}
      <div className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <Link to={detailUrl} className="block h-full" onClick={() => onItemClick?.(item)}>
          <img
            src={image}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-white/80 bg-white/90 text-slate-600 transition hover:scale-110 hover:text-rose-500 shadow-sm"
          aria-label={fav ? 'Bỏ yêu thích' : 'Yêu thích món'}
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Body Info */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div>
          {reasonLabel && (
            <span className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-600">
              {reasonLabel}
            </span>
          )}
          <Link to={detailUrl} onClick={() => onItemClick?.(item)}>
            <h3 className="font-bold text-slate-800 transition group-hover:text-orange-500 line-clamp-1 text-base">
              {item.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{restaurantName}</p>
        </div>

        {/* Rating & Delivery Info */}
        {(ratingAvg !== undefined || deliveryTime) && (
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            {ratingAvg !== undefined && (
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(ratingAvg).toFixed(1)}
              </span>
            )}
            {deliveryTime && (
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {deliveryTime}
              </span>
            )}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5">
            <b className="text-base font-extrabold text-orange-600">
              {formatMoney(displayPrice)}
            </b>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatMoney(originalPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAddToCart?.(item)}
            disabled={item.isAvailable === false}
            className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600 font-bold transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            title="Thêm vào giỏ"
            aria-label={`Thêm ${item.name} vào giỏ hàng`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
