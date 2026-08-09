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
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

const formatMoney = (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
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

  // Use parent restaurant's rating
  const ratingAvg = item.restaurantId?.ratingSummary?.average ?? 4.8
  const deliveryTime = item.restaurantId?.delivery
    ? `${item.restaurantId.delivery.minMinutes}–${item.restaurantId.delivery.maxMinutes} phút`
    : '20–30 phút'

  const restaurantName = item.restaurantId?.name || 'Nhà hàng'
  const restaurantSlug = item.restaurantId?.slug

  const detailUrl = restaurantSlug
    ? `/restaurants/${restaurantSlug}/menu-items/${item.slug}`
    : '/restaurants'

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#e7ece8] bg-white shadow-[0_5px_18px_rgba(34,63,43,.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(32,70,45,.10)]">
      {/* Image Header */}
      <div className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <Link to={detailUrl} className="block h-full">
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
          <Link to={detailUrl}>
            <h3 className="font-bold text-[#17201a] transition group-hover:text-[#ff5a1f] line-clamp-1 text-base">
              {item.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-[#68736c] line-clamp-1">{restaurantName}</p>
        </div>

        {/* Rating & Delivery Info */}
        <div className="flex items-center gap-3 text-xs font-semibold text-[#68736c]">
          <span className="flex items-center gap-1 text-[#e69b00] font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {Number(ratingAvg).toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {deliveryTime}
          </span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e7ece8]">
          <div className="flex items-baseline gap-1.5">
            <b className="text-base font-extrabold text-[#ff5a1f]">
              {formatMoney(displayPrice)}
            </b>
            {originalPrice && (
              <span className="text-xs text-[#68736c] line-through">
                {formatMoney(originalPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAddToCart?.(item)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0e9] text-[#ff5a1f] font-bold transition hover:bg-[#ff5a1f] hover:text-white"
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
