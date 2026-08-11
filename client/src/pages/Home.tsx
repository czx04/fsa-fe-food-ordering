import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import {
  DEFAULT_DISH_IMAGE_URL,
  HOME_PROMOTION_IMAGE_URL,
} from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { LoginModal } from "../components/LoginModal";
import { MenuItemCard, MenuItemCardData } from "../components/cards/MenuItemCard";
import { RestaurantCard, RestaurantCardData } from "../components/cards/RestaurantCard";
import { useCart } from "../contexts/CartContext";
import {
  Zap,
  Star,
  Gift,
  Check,
  MapPin,
  Search,
  Utensils,
  Soup,
  Coffee,
  Pizza,
  Salad,
  ArrowRight,
  Tag,
} from "lucide-react";

interface CuisineCategory {
  _id: string;
  name: string;
  imageUrl?: string;
  slug: string;
}

interface CouponItem {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
}

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const { addItemToCart } = useCart();
  const toast = useToast();
  const [categories, setCategories] = useState<CuisineCategory[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantCardData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemCardData[]>([]);
  const [promotions, setPromotions] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("");

  const handleAddToCart = async (item: MenuItemCardData) => {
    if (!isAuthenticated) {
      setSelectedItemName(item.name);
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await addItemToCart({
        restaurantId: item.restaurantId?._id || "",
        menuItemId: item._id,
        quantity: 1,
      });
      toast.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm vào giỏ hàng!");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, resRes, menuRes, promoRes] = await Promise.all([
          api.get("/public/categories"),
          api.get("/public/restaurants?limit=6"),
          api.get("/public/menu-items?limit=4"),
          api.get("/public/promotions").catch(() => ({ data: [] })),
        ]);
        setCategories(catRes.data);
        setRestaurants(
          Array.isArray(resRes.data) ? resRes.data : resRes.data.data,
        );
        setMenuItems(menuRes.data);
        setPromotions(promoRes.data || []);
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
      return <Soup className="w-6 h-6 text-orange-500" />;
    if (name.includes("Trà Sữa") || name.includes("Cafe"))
      return <Coffee className="w-6 h-6 text-amber-600" />;
    if (name.includes("Healthy") || name.includes("Salad"))
      return <Salad className="w-6 h-6 text-orange-500" />;
    if (name.includes("Pizza") || name.includes("Âu"))
      return <Pizza className="w-6 h-6 text-rose-500" />;
    return <Utensils className="w-6 h-6 text-orange-500" />;
  };

  const activeCoupon = promotions.length > 0 ? promotions[0] : null;

  return (
    <main className="bg-slate-50/50 min-h-screen text-slate-800 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-orange-50/60 pt-8 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider rounded-full">
                <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />{" "}
                Giao ngon đến tận cửa
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
                Đói bụng ư? Món ngon{" "}
                <span className="text-orange-500">
                  đến liền!
                </span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
                Khám phá hàng trăm nhà hàng quanh bạn. Đặt món trong vài chạm,
                theo dõi đơn theo thời gian thực.
              </p>

              {/* Search bar */}
              <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-md border border-slate-200/80 flex flex-col sm:flex-row gap-2 max-w-2xl">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm font-medium border border-slate-200 sm:w-1/3">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <input
                    className="bg-transparent border-none focus:outline-none w-full text-slate-700 text-xs font-semibold"
                    defaultValue="Hà Nội"
                    aria-label="Địa chỉ"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    placeholder="Tìm món ăn, nhà hàng..."
                    className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-700"
                  />
                </div>
                <Link
                  to="/restaurants"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl text-center shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Tìm món</span>
                </Link>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />{" "}
                  1.000+ nhà hàng
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />{" "}
                  Giao nhanh 30 phút
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />{" "}
                  Thanh toán an toàn
                </span>
              </div>
            </div>

            {/* Hero Art */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-md">
                <img
                  src={DEFAULT_DISH_IMAGE_URL}
                  alt="Món ăn nổi bật"
                  className="relative rounded-3xl shadow-xl w-full h-[400px] object-cover border-4 border-white"
                />

                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <Zap className="w-5 h-5 fill-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Giao siêu tốc
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Chỉ từ 20 phút
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 -right-4 bg-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      4.9 / 5
                    </div>
                    <div className="text-[10px] text-slate-400">
                      12k+ đánh giá
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 left-8 bg-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <Gift className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-orange-600">
                      FREESHIP
                    </div>
                    <div className="text-[10px] text-slate-400">Đơn từ 99k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Bạn muốn ăn gì?
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Danh mục nổi bật
              </h2>
            </div>
            <Link
              to="/restaurants"
              className="text-sm font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm">Đang tải danh mục...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((c) => (
                <Link
                  to={`/restaurants?cuisine=${c.slug}`}
                  key={c._id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex items-center gap-3 group"
                >
                  <div className="p-2.5 bg-orange-50 rounded-xl group-hover:scale-110 transition duration-200">
                    {getCategoryIcon(c.name)}
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-slate-800 group-hover:text-orange-600 transition">
                      {c.name}
                    </strong>
                    <small className="text-[10px] font-medium text-orange-600">
                      Đang mở
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-12 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Mọi người đang mê
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Món ngon quanh bạn
              </h2>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-sm">
                Phổ biến
              </span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition cursor-pointer">
                Gần tôi
              </span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition cursor-pointer">
                Giảm giá
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm">Đang tải món ăn...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner from Coupon API */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-500 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase rounded-full">
                <Tag className="w-3.5 h-3.5" />
                {activeCoupon ? "Mã ưu đãi độc quyền" : "Ưu đãi đặc biệt"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                {activeCoupon
                  ? activeCoupon.discountType === "percentage"
                    ? `Giảm tới ${activeCoupon.discountValue}% cho đơn hàng!`
                    : `Giảm trực tiếp ${new Intl.NumberFormat("vi-VN").format(activeCoupon.discountValue)}đ!`
                  : "Giảm 20% cho đơn hàng đầu tiên"}
              </h2>
              <p className="text-orange-100 text-sm leading-relaxed">
                Nhập mã{" "}
                <b className="bg-white text-orange-600 px-2.5 py-1 rounded-lg font-extrabold text-base tracking-wide shadow-sm">
                  {activeCoupon ? activeCoupon.code : "FOODIE20"}
                </b>{" "}
                {activeCoupon?.minOrderAmount
                  ? `cho đơn từ ${new Intl.NumberFormat("vi-VN").format(activeCoupon.minOrderAmount)}đ`
                  : "và tận hưởng bữa ăn ngon chuẩn vị."}
              </p>
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                <span>Khám phá ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <img
              src={HOME_PROMOTION_IMAGE_URL}
              alt="Khuyến mãi"
              className="w-72 h-48 object-cover rounded-2xl shadow-xl transform md:rotate-2 border-4 border-white/20 relative z-10"
            />
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Được yêu thích
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Nhà hàng nổi bật
              </h2>
            </div>
            <Link
              to="/restaurants"
              className="text-sm font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
            >
              <span>Khám phá thêm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm">Đang tải nhà hàng...</p>
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
