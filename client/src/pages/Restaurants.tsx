import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

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
    <main className="restaurants-page">
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Khám phá vị ngon</div>
          <h1>Nhà hàng gần bạn</h1>
          <p className="muted">
            {loading
              ? 'Đang tìm những lựa chọn phù hợp...'
              : `${pagination.total} nhà hàng${openOnly ? ' đang mở' : ''}${district ? ` tại ${district}, ${city}` : ` tại ${city}`}`}
          </p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <form className="toolbar restaurant-toolbar" onSubmit={submitSearch}>
            <input
              className="grow"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="⌕  Tìm tên nhà hàng hoặc địa chỉ"
              aria-label="Tìm tên nhà hàng hoặc địa chỉ"
            />
            <select
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
            <button className="btn" type="submit">Tìm kiếm</button>
          </form>

          <button
            className="btn btn-outline mobile-filter-toggle"
            type="button"
            onClick={() => setShowMobileFilters((value) => !value)}
          >
            ☷ {showMobileFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>

          <div className="listing-layout">
            <aside className={`filter-panel ${showMobileFilters ? 'open' : ''}`}>
              <div className="filter-title">
                <b>Bộ lọc</b>
                <button type="button" className="link-button" onClick={resetFilters}>Xóa tất cả</button>
              </div>
              <div className="filter-group">
                <h4>Loại ẩm thực</h4>
                {categories.map((category) => (
                  <label className="check" key={category._id}>
                    <input
                      type="checkbox"
                      checked={selectedCuisines.includes(category.slug)}
                      onChange={() => toggleCuisine(category.slug)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <h4>Khoảng giá</h4>
                {PRICE_OPTIONS.map((option) => (
                  <label className="check" key={option.value}>
                    <input
                      type="radio"
                      name="price"
                      checked={searchParams.get('priceRange') === option.value}
                      onChange={() => updateParams({ priceRange: option.value })}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <h4>Đánh giá</h4>
                {RATING_OPTIONS.map((rating) => (
                  <label className="check" key={rating}>
                    <input
                      type="radio"
                      name="rating"
                      checked={searchParams.get('minRating') === String(rating)}
                      onChange={() => updateParams({ minRating: String(rating) })}
                    />
                    ★ {rating} sao trở lên
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={openOnly}
                    onChange={(event) => updateParams({ openNow: String(event.target.checked) })}
                  />
                  Chỉ quán đang mở
                </label>
                <label className="check">
                  <input
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

            <div>
              <div className="result-head">
                <div>
                  <b>{pagination.total} kết quả</b>
                  <div className="caption">Kết quả phù hợp nhất với bạn</div>
                </div>
                <button
                  className={`btn btn-outline btn-sm ${showMap ? 'active-view' : ''}`}
                  type="button"
                  onClick={() => setShowMap((value) => !value)}
                >
                  {showMap ? '▦ Danh sách' : '☷ Bản đồ'}
                </button>
              </div>

              {error && <div className="listing-message error-message">{error}</div>}
              {loading && <div className="listing-message">Đang tải danh sách nhà hàng...</div>}

              {!loading && !error && showMap && restaurants.length > 0 && (
                <div className="restaurant-map" aria-label="Bản đồ nhà hàng">
                  <div className="map-grid" />
                  {restaurants.map((restaurant) => (
                    <button
                      className="map-pin"
                      key={restaurant._id}
                      style={getMapPosition(restaurant)}
                      title={`${restaurant.name} · ${restaurant.address}`}
                      type="button"
                    >
                      <span>📍</span>
                      <b>{restaurant.name}</b>
                    </button>
                  ))}
                  <span className="map-label map-label-one">Quận 1</span>
                  <span className="map-label map-label-three">Quận 3</span>
                </div>
              )}

              {!loading && !error && !showMap && restaurants.length > 0 && (
                <div className="cards-3 restaurant-results">
                  {restaurants.map((restaurant) => (
                    <article className="restaurant-card" key={restaurant._id}>
                      <div className="media">
                        <img
                          src={restaurant.coverUrl || restaurant.coverImage || '/assets/restaurant.jpg'}
                          alt={restaurant.name}
                        />
                        <span className={`tag ${restaurant.isOpenNow ? '' : 'closed'}`}>
                          {restaurant.isOpenNow ? 'Mở cửa' : 'Đã đóng'}
                        </span>
                        <button
                          type="button"
                          className={`heart ${favorites.has(restaurant._id) ? 'favorite' : ''}`}
                          onClick={() => toggleFavorite(restaurant._id)}
                          aria-label={`${favorites.has(restaurant._id) ? 'Bỏ yêu thích' : 'Yêu thích'} ${restaurant.name}`}
                        >
                          {favorites.has(restaurant._id) ? '♥' : '♡'}
                        </button>
                      </div>
                      <div className="body">
                        <h3>{restaurant.name}</h3>
                        <p className="caption restaurant-cuisines">
                          {restaurant.cuisineCategories.map((category) => category.name).join(' • ')}
                        </p>
                        <p className="caption restaurant-address">📍 {restaurant.address}</p>
                        <div className="mini-meta">
                          <span className="rating">★ {restaurant.ratingSummary.average.toFixed(1)}</span>
                          <span>◷ {restaurant.delivery.minMinutes}–{restaurant.delivery.maxMinutes} phút</span>
                          <span>₫ {PRICE_OPTIONS.find((option) => option.value === restaurant.priceRange)?.label}</span>
                        </div>
                        <div className="foot">
                          <span className={`caption ${restaurant.delivery.fee === 0 ? 'free-delivery' : ''}`}>
                            {restaurant.delivery.fee === 0
                              ? 'Miễn phí giao hàng'
                              : `Phí giao ${formatMoney(restaurant.delivery.fee)}`}
                          </span>
                          <span className="link">Xem quán →</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading && !error && restaurants.length === 0 && (
                <div className="listing-message empty-results">
                  <span>🍽️</span>
                  <h3>Chưa tìm thấy nhà hàng phù hợp</h3>
                  <p className="muted">Hãy thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
                  <button type="button" className="btn btn-outline" onClick={resetFilters}>Xóa bộ lọc</button>
                </div>
              )}

              {!loading && !error && pagination.totalPages > 1 && (
                <nav className="pagination" aria-label="Phân trang nhà hàng">
                  <button
                    type="button"
                    disabled={pagination.page === 1}
                    onClick={() => updateParams({ page: String(pagination.page - 1) })}
                  >
                    ‹
                  </button>
                  {pageNumbers.map((page, index) => {
                    const previous = pageNumbers[index - 1]
                    return (
                      <span className="pagination-fragment" key={page}>
                        {previous && page - previous > 1 && <span className="pagination-ellipsis">…</span>}
                        <button
                          type="button"
                          className={page === pagination.page ? 'active' : ''}
                          onClick={() => updateParams({ page: String(page) })}
                        >
                          {page}
                        </button>
                      </span>
                    )
                  })}
                  <button
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
