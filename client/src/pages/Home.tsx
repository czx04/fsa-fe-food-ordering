import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'

interface Category {
  _id: string
  name: string
  imageUrl?: string
  displayOrder: number
}

interface Restaurant {
  _id: string
  name: string
  address: string
  phone: string
  coverImage?: string
  rating: number
  openTime: string
  closeTime: string
}

interface MenuItem {
  _id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  restaurantId?: {
    _id: string
    name: string
  }
}

export const Home = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [catRes, resRes, menuRes] = await Promise.all([
          api.get('/public/categories'),
          api.get('/public/restaurants?limit=6'),
          api.get('/public/menu-items?limit=4'),
        ])
        setCategories(catRes.data)
        setRestaurants(Array.isArray(resRes.data) ? resRes.data : resRes.data.data)
        setMenuItems(menuRes.data)
      } catch (error) {
        console.error('Lỗi tải dữ liệu trang chủ:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getEmoji = (name: string) => {
    if (name.includes('Phở') || name.includes('Bún')) return '🍜'
    if (name.includes('Cơm')) return '🍱'
    if (name.includes('Ăn Vặt')) return '🍿'
    if (name.includes('Trà Sữa') || name.includes('Cafe')) return '🧋'
    if (name.includes('Healthy') || name.includes('Salad')) return '🥗'
    if (name.includes('Pizza') || name.includes('Âu')) return '🍕'
    return '🍽️'
  }

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ'
  }

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Giao ngon đến tận cửa</div>
            <h1>Đói bụng ư? Món ngon <span>đến liền!</span></h1>
            <p>Khám phá hàng trăm nhà hàng quanh bạn. Đặt món trong vài chạm, theo dõi đơn theo thời gian thực.</p>
            <div className="search-box">
              <input className="location" defaultValue="📍 Hà Nội" aria-label="Địa chỉ" />
              <input placeholder="Tìm món ăn, nhà hàng..." />
              <Link className="btn" to="/restaurants">Tìm món</Link>
            </div>
            <div className="mini-meta" style={{ marginTop: '18px' }}>
              <span>✓ 1.000+ nhà hàng</span>
              <span>✓ Giao nhanh 30 phút</span>
              <span>✓ Thanh toán an toàn</span>
            </div>
          </div>
          
          <div className="hero-art">
            <img src="/assets/noodles.jpg" alt="Món ăn nổi bật" />
            <div className="float-card one">
              <i>⚡</i>
              <span>Giao siêu tốc<br/><small className="muted">Chỉ từ 20 phút</small></span>
            </div>
            <div className="float-card two">
              <i>★</i>
              <span>4.9/5<br/><small className="muted">12k+ đánh giá</small></span>
            </div>
            <div className="float-card three">
              <i>🎁</i>
              <span>FREESHIP<br/><small className="muted">Đơn từ 99k</small></span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-sm">
        <div className="container">
          <div className="section-title">
            <div>
              <div className="eyebrow">Bạn muốn ăn gì?</div>
              <h2>Danh mục nổi bật</h2>
            </div>
            <Link className="link" to="/restaurants">Xem tất cả →</Link>
          </div>
          {loading ? (
            <p className="muted">Đang tải danh mục...</p>
          ) : (
            <div className="category-grid">
              {categories.map((c) => (
                <Link className="category" to="/restaurants" key={c._id}>
                  <span className="emoji">{getEmoji(c.name)}</span>
                  <span><strong>{c.name}</strong><small>Đang mở</small></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Menu Items */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <div className="eyebrow">Mọi người đang mê</div>
              <h2>Món ngon quanh bạn</h2>
            </div>
            <div className="chip-row">
              <span className="chip active">Phổ biến</span>
              <span className="chip">Gần tôi</span>
              <span className="chip">Giảm giá</span>
            </div>
          </div>
          {loading ? (
            <p className="muted">Đang tải món ăn...</p>
          ) : (
            <div className="cards-4">
              {menuItems.map((f, i) => (
                <article className="food-card" key={f._id}>
                  <Link to="/dish-detail">
                    <div className="media">
                      <img src={f.imageUrl || '/assets/noodles.jpg'} alt={f.name} />
                      <span className="tag">{i % 2 === 0 ? '-20%' : 'Bán chạy'}</span>
                      <span className="heart">♡</span>
                    </div>
                  </Link>
                  <div className="body">
                    <h3>{f.name}</h3>
                    <p className="caption">{f.restaurantId?.name || 'Nhà hàng'}</p>
                    <div className="mini-meta">
                      <span className="rating">★ 4.8</span>
                      <span>◷ 20–30 phút</span>
                    </div>
                    <div className="foot">
                      <span>
                        <b className="price">{formatMoney(f.price)}</b>
                      </span>
                      <button className="add btn btn-sm">＋</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo */}
      <section className="section-sm">
        <div className="container">
          <div className="promo">
            <div>
              <div className="eyebrow">Ưu đãi hôm nay</div>
              <h2>Giảm 20% cho đơn đầu tiên</h2>
              <p className="muted">Nhập mã <b>HELLOMAM</b> và tận hưởng bữa ăn ngon hơn với giá mềm hơn.</p>
              <Link className="btn" to="/restaurants">Đặt món ngay</Link>
            </div>
            <img src="/assets/chicken.jpg" alt="Khuyến mãi" />
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <div className="eyebrow">Được yêu thích</div>
              <h2>Nhà hàng nổi bật</h2>
            </div>
            <Link className="link" to="/restaurants">Khám phá thêm →</Link>
          </div>
          {loading ? (
            <p className="muted">Đang tải nhà hàng...</p>
          ) : (
            <div className="cards-3">
              {restaurants.map((r, i) => (
                <article className="restaurant-card" key={r._id}>
                  <Link to="/restaurant-detail">
                    <div className="media">
                      <img src={r.coverImage || '/assets/restaurant.jpg'} alt={r.name} />
                      <span className="tag">{i === 0 ? 'Hot' : 'Mở cửa'}</span>
                      <span className="heart">♡</span>
                    </div>
                  </Link>
                  <div className="body">
                    <h3>{r.name}</h3>
                    <p className="caption">{r.address}</p>
                    <div className="mini-meta">
                      <span className="rating">★ {r.rating || 4.8}</span>
                      <span>◷ {r.openTime} - {r.closeTime}</span>
                    </div>
                    <div className="foot">
                      <span className="caption">Miễn phí giao hàng</span>
                      <Link className="link" to="/restaurant-detail">Xem quán →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
