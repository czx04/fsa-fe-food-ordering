import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../utils/api'

interface CuisineCategory {
  _id: string
  name: string
  slug: string
}

interface Restaurant {
  _id: string
  name: string
  slug: string
  description: string
  coverUrl: string | null
  coverImage: string | null
  address: string
  addressDetails: {
    district: string
    city: string
    location?: {
      type: 'Point'
      coordinates: [number, number]
    }
  }
  location?: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  cuisineCategories: CuisineCategory[]
  priceRange: 'budget' | 'mid' | 'premium'
  delivery: {
    fee: number
    minMinutes: number
    maxMinutes: number
  }
  ratingSummary: {
    average: number
    count: number
  }
  isOpenNow: boolean
}

interface RestaurantResponse {
  data: Restaurant[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const PRICE_OPTIONS = [
  { value: 'budget', label: 'Dưới 100.000đ' },
  { value: 'mid', label: '100.000đ – 200.000đ' },
  { value: 'premium', label: 'Trên 200.000đ' },
] as const

const RATING_OPTIONS = [4.5, 4, 3.5]

const CONTAINER_CLASS =
  'mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] max-[760px]:w-[calc(100%-1.5rem)]'
const FORM_CONTROL_CLASS =
  'h-[42px] min-w-[155px] rounded-[9px] border border-[#e7ece8] bg-white px-3 text-[#17201a] outline-none transition focus:border-[#2eae62] focus:ring-4 focus:ring-[#2eae62]/10 max-[760px]:w-full'
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-[#ff5a1f] px-5 py-[11px] font-bold text-white transition hover:-translate-y-px hover:bg-[#e94e16] focus:outline-none focus:ring-4 focus:ring-[#ff5a1f]/20'
const OUTLINE_BUTTON_CLASS =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#e7ece8] bg-white px-5 py-[11px] font-bold text-[#17201a] transition hover:-translate-y-px hover:border-[#ff5a1f] focus:outline-none focus:ring-4 focus:ring-[#ff5a1f]/10'
const FILTER_LABEL_CLASS =
  'my-[9px] flex cursor-pointer items-center gap-[9px] text-xs text-[#68736c]'
const PAGINATION_BUTTON_CLASS =
  'grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-[9px] border border-[#e7ece8] bg-white font-bold text-[#17201a] transition hover:border-[#ff5a1f] hover:text-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-40'

const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`

const getMapPosition = (restaurant: Restaurant) => {
  const coordinates = restaurant.location?.coordinates ?? restaurant.addressDetails.location?.coordinates
  if (!coordinates) return { left: '50%', top: '50%' }
  const [lng, lat] = coordinates
  const left = Math.min(92, Math.max(8, ((lng - 106.684) / 0.022) * 84 + 8))
  const top = Math.min(88, Math.max(12, ((10.789 - lat) / 0.018) * 76 + 12))
  return { left: `${left}%`, top: `${top}%` }
}

export const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<CuisineCategory[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [pagination, setPagination] = useState<RestaurantResponse['pagination']>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })
  const [draftSearch, setDraftSearch] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const selectedCuisines = useMemo(
    () => (searchParams.get('cuisine') ?? '').split(',').filter(Boolean),
    [searchParams]
  )
  const district = searchParams.get('district') ?? ''
  const city = searchParams.get('city') ?? 'TP.HCM'
  const openOnly = searchParams.get('openNow') !== 'false'

  useEffect(() => {
    let active = true
    api
      .get<CuisineCategory[]>('/public/categories')
      .then((response) => {
        if (active) setCategories(response.data)
      })
      .catch(() => {
        if (active) setError('Không thể tải danh mục ẩm thực.')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const fetchRestaurants = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams(searchParams)
        if (!params.has('sort')) params.set('sort', 'popular_desc')
        if (!params.has('openNow')) params.set('openNow', 'true')
        if (!params.has('limit')) params.set('limit', '9')
        const response = await api.get<RestaurantResponse>('/public/restaurants', { params })
        if (!active) return
        setRestaurants(response.data.data)
        setPagination(response.data.pagination)
      } catch {
        if (active) setError('Không thể tải danh sách nhà hàng. Vui lòng thử lại.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchRestaurants()
    return () => {
      active = false
    }
  }, [searchParams])

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    if (!Object.hasOwn(updates, 'page')) next.set('page', '1')
    setSearchParams(next)
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    updateParams({ q: draftSearch.trim() || null })
  }

  const toggleCuisine = (slug: string) => {
    const next = selectedCuisines.includes(slug)
      ? selectedCuisines.filter((item) => item !== slug)
      : [...selectedCuisines, slug]
    updateParams({ cuisine: next.length > 0 ? next.join(',') : null })
  }

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetFilters = () => {
    setDraftSearch('')
    setSearchParams({ sort: 'popular_desc', openNow: 'true', page: '1' })
  }

  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === pagination.totalPages || Math.abs(page - pagination.page) <= 1
  )

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#17201a]">
      <section className="bg-[#dff7e7] py-12">
        <div className={CONTAINER_CLASS}>
          <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2eae62]">
            Khám phá vị ngon
          </div>
          <h1 className="mb-2.5 text-[38px] font-bold leading-tight tracking-[-.035em]">
            Nhà hàng gần bạn
          </h1>
          <p className="mb-0 text-[#68736c]">
            {loading
              ? 'Đang tìm những lựa chọn phù hợp...'
              : `${pagination.total} nhà hàng${openOnly ? ' đang mở' : ''}${district ? ` tại ${district}, ${city}` : ` tại ${city}`}`}
          </p>
        </div>
      </section>

      <section className="py-[38px]">
        <div className={CONTAINER_CLASS}>
          <form
            className="mb-6 flex items-center gap-3 rounded-[14px] border border-[#e7ece8] bg-white p-[14px] max-[760px]:flex-col max-[760px]:items-stretch"
            onSubmit={submitSearch}
          >
            <input
              className={`${FORM_CONTROL_CLASS} flex-1`}
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="⌕  Tìm tên nhà hàng hoặc địa chỉ"
              aria-label="Tìm tên nhà hàng hoặc địa chỉ"
            />
            <select
              className={FORM_CONTROL_CLASS}
              value={district ? `${district}|${city}` : ''}
              onChange={(event) => {
                const [nextDistrict, nextCity] = event.target.value.split('|')
                updateParams({ district: nextDistrict || null, city: nextCity || null })
              }}
              aria-label="Khu vực"
            >
              <option value="">Tất cả khu vực</option>
              <option value="Quận 1|TP.HCM">Quận 1, TP.HCM</option>
              <option value="Quận 3|TP.HCM">Quận 3, TP.HCM</option>
            </select>
            <select
              className={FORM_CONTROL_CLASS}
              value={searchParams.get('sort') ?? 'popular_desc'}
              onChange={(event) => updateParams({ sort: event.target.value })}
              aria-label="Sắp xếp"
            >
              <option value="popular_desc">Sắp xếp: Phổ biến</option>
              <option value="rating_desc">Đánh giá cao</option>
              <option value="delivery_asc">Giao nhanh nhất</option>
              <option value="price_asc">Giá thấp trước</option>
              <option value="newest">Mới nhất</option>
            </select>
            <button className={`${PRIMARY_BUTTON_CLASS} max-[760px]:w-full`} type="submit">
              Tìm kiếm
            </button>
          </form>

          <button
            className={`${OUTLINE_BUTTON_CLASS} mb-4 hidden max-[760px]:inline-flex`}
            type="button"
            onClick={() => setShowMobileFilters((value) => !value)}
          >
            ☷ {showMobileFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>

          <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-[26px] max-[760px]:grid-cols-1">
            <aside
              className={`sticky top-[92px] rounded-2xl border border-[#e7ece8] bg-white p-[18px] max-[760px]:static ${
                showMobileFilters ? 'max-[760px]:block' : 'max-[760px]:hidden'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <b>Bộ lọc</b>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-[#ff5a1f]"
                  onClick={resetFilters}
                >
                  Xóa tất cả
                </button>
              </div>
              <div className="border-b border-[#e7ece8] py-4">
                <h4 className="mb-3 font-bold">Loại ẩm thực</h4>
                {categories.map((category) => (
                  <label className={FILTER_LABEL_CLASS} key={category._id}>
                    <input
                      className="h-4 w-4 accent-[#ff5a1f]"
                      type="checkbox"
                      checked={selectedCuisines.includes(category.slug)}
                      onChange={() => toggleCuisine(category.slug)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              <div className="border-b border-[#e7ece8] py-4">
                <h4 className="mb-3 font-bold">Khoảng giá</h4>
                {PRICE_OPTIONS.map((option) => (
                  <label className={FILTER_LABEL_CLASS} key={option.value}>
                    <input
                      className="h-4 w-4 accent-[#ff5a1f]"
                      type="radio"
                      name="price"
                      checked={searchParams.get('priceRange') === option.value}
                      onChange={() => updateParams({ priceRange: option.value })}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div className="border-b border-[#e7ece8] py-4">
                <h4 className="mb-3 font-bold">Đánh giá</h4>
                {RATING_OPTIONS.map((rating) => (
                  <label className={FILTER_LABEL_CLASS} key={rating}>
                    <input
                      className="h-4 w-4 accent-[#ff5a1f]"
                      type="radio"
                      name="rating"
                      checked={searchParams.get('minRating') === String(rating)}
                      onChange={() => updateParams({ minRating: String(rating) })}
                    />
                    ★ {rating} sao trở lên
                  </label>
                ))}
              </div>
              <div className="pt-4">
                <label className={FILTER_LABEL_CLASS}>
                  <input
                    className="h-4 w-4 accent-[#ff5a1f]"
                    type="checkbox"
                    checked={openOnly}
                    onChange={(event) => updateParams({ openNow: String(event.target.checked) })}
                  />
                  Chỉ quán đang mở
                </label>
                <label className={FILTER_LABEL_CLASS}>
                  <input
                    className="h-4 w-4 accent-[#ff5a1f]"
                    type="checkbox"
                    checked={searchParams.get('freeDelivery') === 'true'}
                    onChange={(event) =>
                      updateParams({ freeDelivery: event.target.checked ? 'true' : null })
                    }
                  />
                  Miễn phí giao hàng
                </label>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <b>{pagination.total} kết quả</b>
                  <div className="text-xs text-[#68736c]">Kết quả phù hợp nhất với bạn</div>
                </div>
                <button
                  className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-[13px] py-2 text-xs font-bold transition hover:-translate-y-px focus:outline-none focus:ring-4 focus:ring-[#ff5a1f]/10 ${
                    showMap
                      ? 'border-[#ff5a1f] bg-[#fff0e9] text-[#ff5a1f]'
                      : 'border-[#e7ece8] bg-white text-[#17201a]'
                  }`}
                  type="button"
                  onClick={() => setShowMap((value) => !value)}
                >
                  {showMap ? '▦ Danh sách' : '☷ Bản đồ'}
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-[#f5bcbc] bg-[#fff7f7] px-6 py-12 text-center text-[#e34444]">
                  {error}
                </div>
              )}
              {loading && (
                <div className="rounded-2xl border border-[#e7ece8] bg-white px-6 py-12 text-center text-[#68736c]">
                  Đang tải danh sách nhà hàng...
                </div>
              )}

              {!loading && !error && showMap && restaurants.length > 0 && (
                <div
                  className="relative min-h-[560px] overflow-hidden rounded-[18px] border border-[#dce8df] bg-[#edf6ee] shadow-[0_8px_24px_rgba(34,63,43,.08)] max-[760px]:min-h-[460px]"
                  aria-label="Bản đồ nhà hàng"
                >
                  <div className="absolute left-[-10%] top-[46%] h-[38px] w-[120%] -rotate-[24deg] rounded-full bg-[rgba(110,178,225,.22)]" />
                  <div className="absolute right-[-12%] top-[22%] h-6 w-[70%] -rotate-[24deg] rounded-full bg-[rgba(110,178,225,.22)]" />
                  {restaurants.map((restaurant) => (
                    <button
                      className="absolute z-[2] grid max-w-[130px] -translate-x-1/2 -translate-y-1/2 cursor-pointer justify-items-center gap-[3px] border-0 bg-transparent text-[#17201a]"
                      key={restaurant._id}
                      style={getMapPosition(restaurant)}
                      title={`${restaurant.name} · ${restaurant.address}`}
                      type="button"
                    >
                      <span className="grid h-[42px] w-[42px] -rotate-45 place-items-center rounded-[50%_50%_50%_8px] border border-[#dce8df] bg-white text-xl">
                        <span className="rotate-45">📍</span>
                      </span>
                      <b className="rounded-md border border-[#dce8df] bg-white/90 px-[7px] py-1 text-[10px]">
                        {restaurant.name}
                      </b>
                    </button>
                  ))}
                  <span className="absolute bottom-[18%] right-[12%] text-[28px] font-extrabold tracking-[.08em] text-[rgba(23,32,26,.34)]">
                    Quận 1
                  </span>
                  <span className="absolute left-[10%] top-[14%] text-[28px] font-extrabold tracking-[.08em] text-[rgba(23,32,26,.34)]">
                    Quận 3
                  </span>
                </div>
              )}

              {!loading && !error && !showMap && restaurants.length > 0 && (
                <div className="grid grid-cols-3 items-stretch gap-[22px] max-[760px]:grid-cols-1">
                  {restaurants.map((restaurant) => (
                    <article
                      className="flex flex-col overflow-hidden rounded-2xl border border-[#e7ece8] bg-white shadow-[0_5px_18px_rgba(34,63,43,.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(32,70,45,.10)]"
                      key={restaurant._id}
                    >
                      <div className="relative h-[190px] overflow-hidden bg-[#dff7e7]">
                        <Link to={`/restaurants/${restaurant.slug}`} className="block h-full">
                          <img
                            className="h-full w-full object-cover"
                            src={restaurant.coverUrl || restaurant.coverImage || '/assets/restaurant.jpg'}
                            alt={restaurant.name}
                          />
                          <span
                            className={`absolute left-3 top-3 rounded-[7px] px-[9px] py-1.5 text-[10px] font-extrabold text-white ${
                              restaurant.isOpenNow ? 'bg-[#ff5a1f]' : 'bg-[#53615a]'
                            }`}
                          >
                            {restaurant.isOpenNow ? 'Mở cửa' : 'Đã đóng'}
                          </span>
                        </Link>
                        <button
                          type="button"
                          className={`absolute right-3 top-3 grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-white/75 bg-white/90 p-0 text-lg transition hover:scale-105 ${
                            favorites.has(restaurant._id) ? 'bg-white text-[#e34444]' : 'text-[#17201a]'
                          }`}
                          onClick={() => toggleFavorite(restaurant._id)}
                          aria-label={`${favorites.has(restaurant._id) ? 'Bỏ yêu thích' : 'Yêu thích'} ${restaurant.name}`}
                        >
                          {favorites.has(restaurant._id) ? '♥' : '♡'}
                        </button>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <Link to={`/restaurants/${restaurant.slug}`}>
                          <h3 className="mb-[5px] text-[15px] font-bold leading-snug transition hover:text-[#ff5a1f]">{restaurant.name}</h3>
                        </Link>
                        <p className="mb-0 min-h-[19px] text-xs text-[#68736c]">
                          {restaurant.cuisineCategories.map((category) => category.name).join(' • ')}
                        </p>
                        <p className="mb-2.5 mt-[7px] min-h-[38px] text-xs text-[#68736c]">
                          📍 {restaurant.address}
                        </p>
                        <div className="flex flex-wrap gap-2.5 text-[11px] text-[#68736c]">
                          <span className="font-bold text-[#e69b00]">★ {restaurant.ratingSummary.average.toFixed(1)}</span>
                          <span>◷ {restaurant.delivery.minMinutes}–{restaurant.delivery.maxMinutes} phút</span>
                          <span>₫ {PRICE_OPTIONS.find((option) => option.value === restaurant.priceRange)?.label}</span>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                          <span
                            className={`text-xs ${
                              restaurant.delivery.fee === 0
                                ? 'font-bold text-[#167a3e]'
                                : 'text-[#68736c]'
                            }`}
                          >
                            {restaurant.delivery.fee === 0
                              ? 'Miễn phí giao hàng'
                              : `Phí giao ${formatMoney(restaurant.delivery.fee)}`}
                          </span>
                          <Link to={`/restaurants/${restaurant.slug}`} className="shrink-0 font-bold text-[#ff5a1f]">Xem quán →</Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading && !error && restaurants.length === 0 && (
                <div className="rounded-2xl border border-[#e7ece8] bg-white px-6 py-12 text-center text-[#68736c]">
                  <span className="mb-3 block text-[52px]">🍽️</span>
                  <h3 className="mb-2 text-lg font-bold text-[#17201a]">Chưa tìm thấy nhà hàng phù hợp</h3>
                  <p>Hãy thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
                  <button type="button" className={OUTLINE_BUTTON_CLASS} onClick={resetFilters}>
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              {!loading && !error && pagination.totalPages > 1 && (
                <nav className="mt-[34px] flex justify-center gap-2" aria-label="Phân trang nhà hàng">
                  <button
                    className={PAGINATION_BUTTON_CLASS}
                    type="button"
                    disabled={pagination.page === 1}
                    onClick={() => updateParams({ page: String(pagination.page - 1) })}
                  >
                    ‹
                  </button>
                  {pageNumbers.map((page, index) => {
                    const previous = pageNumbers[index - 1]
                    return (
                      <span className="flex items-center gap-2" key={page}>
                        {previous && page - previous > 1 && <span className="text-[#68736c]">…</span>}
                        <button
                          type="button"
                          className={`${PAGINATION_BUTTON_CLASS} ${
                            page === pagination.page
                              ? 'border-[#ff5a1f] bg-[#ff5a1f] text-white hover:text-white'
                              : ''
                          }`}
                          onClick={() => updateParams({ page: String(page) })}
                        >
                          {page}
                        </button>
                      </span>
                    )
                  })}
                  <button
                    className={PAGINATION_BUTTON_CLASS}
                    type="button"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => updateParams({ page: String(pagination.page + 1) })}
                  >
                    ›
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
