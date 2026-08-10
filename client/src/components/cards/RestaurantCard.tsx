import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, MapPin, Heart, ChevronRight } from 'lucide-react'

export interface RestaurantCardData {
  _id: string
  name: string
  slug: string
  coverUrl?: string | null
  coverImage?: string | null
  address?: string | { formatted?: string; line1?: string }
  cuisineCategories?: Array<{ _id: string; name: string }>
  ratingSummary?: {
    average: number
    count?: number
  }
  rating?: number
  delivery?: {
    fee: number
    minMinutes: number
    maxMinutes: number
  }
  openTime?: string
  closeTime?: string
  isOpenNow?: boolean
  priceRange?: 'budget' | 'mid' | 'premium'
}

interface RestaurantCardProps {
  restaurant: RestaurantCardData
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

const formatMoney = (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [fav, setFav] = useState(isFavorite)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFav((prev) => !prev)
    if (onToggleFavorite) {
      onToggleFavorite(restaurant._id)
    }
  }

  const cover =
    restaurant.coverUrl || restaurant.coverImage || '/assets/restaurant.jpg'

  const addressText =
    typeof restaurant.address === 'string'
      ? restaurant.address
      : restaurant.address?.formatted || restaurant.address?.line1 || 'Địa chỉ đang cập nhật'

  const ratingAvg =
    restaurant.ratingSummary?.average ?? restaurant.rating ?? 4.8

  const categoriesText =
    restaurant.cuisineCategories && restaurant.cuisineCategories.length > 0
      ? restaurant.cuisineCategories.map((c) => c.name).join(' • ')
      : null

  const isOpen = restaurant.isOpenNow ?? true

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Image Header */}
      <div className="relative h-[190px] overflow-hidden bg-orange-50">
        <Link to={`/restaurants/${restaurant.slug}`} className="block h-full">
          <img
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={cover}
            alt={restaurant.name}
          />
          <span
            className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ${
              isOpen ? 'bg-orange-500' : 'bg-slate-600'
            }`}
          >
            {isOpen ? 'Mở cửa' : 'Đã đóng'}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-white/80 bg-white/90 text-slate-600 transition hover:scale-110 hover:text-rose-500 shadow-sm"
          aria-label={fav ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/restaurants/${restaurant.slug}`}>
          <h3 className="mb-1 text-base font-bold leading-snug text-slate-800 transition group-hover:text-orange-500 line-clamp-1">
            {restaurant.name}
          </h3>
        </Link>

        {categoriesText && (
          <p className="mb-1 text-xs text-slate-500 line-clamp-1">{categoriesText}</p>
        )}

        <p className="mb-3 text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{addressText}</span>
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {Number(ratingAvg).toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {restaurant.delivery
              ? `${restaurant.delivery.minMinutes}–${restaurant.delivery.maxMinutes} phút`
              : restaurant.openTime && restaurant.closeTime
              ? `${restaurant.openTime} - ${restaurant.closeTime}`
              : '20-30 phút'}
          </span>
        </div>

        {/* Footer Row */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          <span
            className={`${
              restaurant.delivery?.fee === 0
                ? 'font-bold text-orange-600'
                : 'text-slate-500'
            }`}
          >
            {restaurant.delivery
              ? restaurant.delivery.fee === 0
                ? 'Miễn phí giao hàng'
                : `Phí giao ${formatMoney(restaurant.delivery.fee)}`
              : 'Miễn phí giao hàng'}
          </span>
          <Link
            to={`/restaurants/${restaurant.slug}`}
            className="flex items-center gap-0.5 font-bold text-orange-500 hover:text-orange-600 transition"
          >
            <span>Xem quán</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
