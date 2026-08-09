import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "../components/LoginModal";
import { Button } from "../components/ui/Button";
import { RestaurantCard } from "../components/cards/RestaurantCard";
import { MenuItemCard } from "../components/cards/MenuItemCard";
import {
  Zap,
  Star,
  Gift,
  Check,
  MapPin,
  Search,
  Soup,
  Coffee,
  Pizza,
  Salad,
  Utensils,
  ArrowRight,
} from "lucide-react";

interface CuisineCategory {
  _id: string;
  name: string;
  imageUrl?: string;
  slug: string;
}

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<CuisineCategory[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("");

  const handleAddToCart = (item: any) => {
    if (!isAuthenticated) {
      setSelectedItemName(item.name);
      setIsLoginModalOpen(true);
      return;
    }
    alert(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, resRes, menuRes] = await Promise.all([
          api.get("/public/categories"),
          api.get("/public/restaurants?limit=6"),
          api.get("/public/menu-items?limit=4"),
        ]);
        setCategories(catRes.data);
        setRestaurants(
          Array.isArray(resRes.data) ? resRes.data : resRes.data.data || []
        );
        setMenuItems(
          Array.isArray(menuRes.data) ? menuRes.data : menuRes.data.data || []
        );
      } catch (error) {
        console.error("Lỗi tải dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryIcon = (name: string) => {
    if (name.includes("Phở") || name.includes("Bún"))
      return <Soup className="w-5 h-5 text-[#ff5a1f]" />;
    if (name.includes("Trà Sữa") || name.includes("Cafe"))
      return <Coffee className="w-5 h-5 text-amber-600" />;
    if (name.includes("Healthy") || name.includes("Salad"))
      return <Salad className="w-5 h-5 text-[#ff5a1f]" />;
    if (name.includes("Pizza") || name.includes("Âu"))
      return <Pizza className="w-5 h-5 text-rose-500" />;
    return <Utensils className="w-5 h-5 text-[#ff5a1f]" />;
  };

  return (
    <main className="bg-[#f7faf7] min-h-screen text-[#17201a] pb-16">
      {/* Hero Section */}
      <section className="bg-[#fff0e9] pt-10 pb-16">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#ff5a1f] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                <Zap className="w-3.5 h-3.5 fill-[#ff5a1f] text-[#ff5a1f]" />
                Giao ngon đến tận cửa
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#17201a] leading-tight tracking-tight">
                Đói bụng ư? Món ngon <span className="text-[#ff5a1f]">đến liền!</span>
              </h1>
              <p className="text-[#68736c] text-base leading-relaxed max-w-xl">
                Khám phá hàng trăm nhà hàng quanh bạn. Đặt món trong vài chạm, theo dõi đơn theo thời gian thực.
              </p>

              {/* Search bar */}
              <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-[#e7ece8] flex flex-col sm:flex-row gap-2 max-w-2xl">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f7faf7] rounded-xl text-sm font-medium border border-[#e7ece8] sm:w-1/3">
                  <MapPin className="w-4 h-4 text-[#ff5a1f] shrink-0" />
                  <input
                    className="bg-transparent border-none focus:outline-none w-full text-[#17201a] text-xs font-semibold"
                    defaultValue="TP. Hồ Chí Minh"
                    aria-label="Địa chỉ"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    placeholder="Tìm món ăn, nhà hàng..."
                    className="w-full text-sm bg-transparent border-none focus:outline-none text-[#17201a]"
                  />
                </div>
                <Link to="/restaurants">
                  <Button variant="primary" size="md">
                    <Search className="w-4 h-4" />
                    <span>Tìm món</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-5 text-xs font-semibold text-[#68736c] pt-1">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#ff5a1f] stroke-[3]" />
                  1.000+ nhà hàng
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#ff5a1f] stroke-[3]" />
                  Giao nhanh 30 phút
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#ff5a1f] stroke-[3]" />
                  Thanh toán an toàn
                </span>
              </div>
            </div>

            {/* Hero Banner Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-md">
                <img
                  src="/assets/noodles.jpg"
                  alt="Món ăn nổi bật"
                  className="rounded-3xl shadow-md w-full h-[380px] object-cover border-4 border-white"
                />

                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-white p-3 rounded-2xl shadow-md border border-[#e7ece8] flex items-center gap-3">
                  <div className="p-2 bg-[#fff0e9] rounded-xl text-[#ff5a1f]">
                    <Zap className="w-5 h-5 fill-[#ff5a1f]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17201a]">Giao siêu tốc</div>
                    <div className="text-[10px] text-[#68736c]">Chỉ từ 20 phút</div>
                  </div>
                </div>

                <div className="absolute bottom-6 -right-4 bg-white p-3 rounded-2xl shadow-md border border-[#e7ece8] flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17201a]">4.9 / 5</div>
                    <div className="text-[10px] text-[#68736c]">12k+ đánh giá</div>
                  </div>
                </div>

                <div className="absolute -bottom-5 left-6 bg-white p-3 rounded-2xl shadow-md border border-[#e7ece8] flex items-center gap-3">
                  <div className="p-2 bg-[#fff0e9] rounded-xl text-[#ff5a1f]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#ff5a1f]">FREESHIP</div>
                    <div className="text-[10px] text-[#68736c]">Đơn từ 99k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff5a1f]">
                Bạn muốn ăn gì?
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201a] tracking-tight">
                Danh mục nổi bật
              </h2>
            </div>
            <Link to="/restaurants">
              <Button variant="ghost" size="sm">
                <span>Xem tất cả</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-[#68736c] text-sm">Đang tải danh mục...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((c) => (
                <Link
                  to={`/restaurants?cuisine=${c.slug}`}
                  key={c._id}
                  className="bg-white p-4 rounded-2xl border border-[#e7ece8] shadow-sm hover:border-[#ff5a1f] hover:-translate-y-0.5 transition duration-200 flex items-center gap-3 group"
                >
                  <div className="p-2.5 bg-[#f7faf7] rounded-xl group-hover:scale-105 transition duration-200">
                    {getCategoryIcon(c.name)}
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-[#17201a] group-hover:text-[#ff5a1f] transition">
                      {c.name}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-12 bg-white/70">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff5a1f]">
                Mọi người đang mê
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201a] tracking-tight">
                Món ngon quanh bạn
              </h2>
            </div>
          </div>

          {loading ? (
            <p className="text-[#68736c] text-sm">Đang tải món ăn...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems.map((f) => (
                <MenuItemCard
                  key={f._id}
                  item={f}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
          <div className="bg-[#ff5a1f] rounded-3xl p-8 sm:p-12 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 relative z-10">
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase rounded-full backdrop-blur">
                Ưu đãi hôm nay
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Giảm 20% cho đơn đầu tiên
              </h2>
              <p className="text-orange-100 text-sm leading-relaxed">
                Nhập mã{" "}
                <b className="bg-white text-[#ff5a1f] px-2 py-0.5 rounded font-extrabold">
                  HELLOMAM
                </b>{" "}
                và tận hưởng bữa ăn ngon hơn với giá mềm hơn.
              </p>
              <Link to="/restaurants">
                <Button
                  variant="outline"
                  size="md"
                  className="mt-4 border-white/40 bg-white text-[#17201a] hover:bg-slate-100 hover:text-[#17201a]"
                >
                  <span>Đặt món ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <img
              src="/assets/chicken.jpg"
              alt="Khuyến mãi"
              className="w-72 h-48 object-cover rounded-2xl shadow-xl transform md:rotate-3 border-4 border-white/20 relative z-10"
            />
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff5a1f]">
                Được yêu thích
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201a] tracking-tight">
                Nhà hàng nổi bật
              </h2>
            </div>
            <Link to="/restaurants">
              <Button variant="ghost" size="sm">
                <span>Khám phá thêm</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-[#68736c] text-sm">Đang tải nhà hàng...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r) => (
                <RestaurantCard key={r._id} restaurant={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Login Popup Modal for Guests */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        itemName={selectedItemName}
      />
    </main>
  );
};
