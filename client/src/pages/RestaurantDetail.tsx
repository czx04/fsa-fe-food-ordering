import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { LoginModal } from "../components/LoginModal";
import { RestaurantChangeModal } from "../components/RestaurantChangeModal";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { api } from "../utils/api";
import { SERVER_STATIC_ASSET_BASE_URL } from "../utils/constants";
import { AddToCartPayload, CartItem } from "../types/cart";

interface CuisineCategory {
  _id: string;
  name: string;
  slug: string;
}

interface OpeningHour {
  dayOfWeek: number;
  isClosed: boolean;
  slots: Array<{ open: string; close: string }>;
}

interface RestaurantDetailData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  galleryUrls: string[];
  phone: string;
  address: {
    line1: string;
    ward: string;
    district: string;
    city: string;
    formatted: string;
  };
  cuisineCategories: CuisineCategory[];
  openingHours: OpeningHour[];
  operationStatus: "open" | "temporarily_closed" | "suspended";
  isOpenNow: boolean;
  delivery: {
    fee: number;
    minMinutes: number;
    maxMinutes: number;
    maxDistanceKm?: number | null;
  };
  priceRange: "budget" | "mid" | "premium";
  ratingSummary: RatingSummary;
}

interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

interface MenuCategory {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  itemCount: number;
}

interface MenuItem {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrls: string[];
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isAvailable: boolean;
  soldCount: number;
  menuCategory: {
    _id: string;
    name: string;
    slug: string;
  } | null;
}

interface Review {
  _id: string;
  rating: number;
  content: string;
  imageUrls: string[];
  customer: {
    _id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  ownerReply: {
    content: string;
    repliedAt: string;
  } | null;
  createdAt: string;
}

interface ReviewResponse {
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: RatingSummary;
}

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];
const PRICE_LABELS = {
  budget: "Dưới 100.000đ",
  mid: "100.000đ – 200.000đ",
  premium: "Trên 200.000đ",
};

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
const formatCount = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const scrollToSection = (id: string) => {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const RestaurantDetail = () => {
  const { restaurantSlug = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const { cart, addItemToCart, fetchCart } = useCart();
  const [restaurant, setRestaurant] = useState<RestaurantDetailData | null>(
    null,
  );
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<RatingSummary | null>(
    null,
  );
  const [reviewPagination, setReviewPagination] = useState<
    ReviewResponse["pagination"]
  >({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [draftMenuSearch, setDraftMenuSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [pendingItemPayload, setPendingItemPayload] =
    useState<AddToCartPayload | null>(null);
  const [conflictError, setConflictError] = useState("");
  const [loginItem, setLoginItem] = useState("");

  useEffect(() => {
    let active = true;
    const loadRestaurant = async () => {
      setLoading(true);
      setError("");
      try {
        const [restaurantResponse, categoriesResponse] = await Promise.all([
          api.get<{ data: RestaurantDetailData }>(
            `/public/restaurants/${restaurantSlug}`,
          ),
          api.get<{ data: MenuCategory[] }>(
            `/public/restaurants/${restaurantSlug}/menu-categories`,
          ),
        ]);
        if (!active) return;
        setRestaurant(restaurantResponse.data.data);
        setCategories(categoriesResponse.data.data);
        setReviewSummary(restaurantResponse.data.data.ratingSummary);
      } catch (requestError) {
        if (!active) return;
        const isNotFoundError =
          typeof requestError === "object" &&
          requestError !== null &&
          "response" in requestError &&
          (requestError as { response?: { status: number } }).response
            ?.status === 404;
        setError(
          isNotFoundError
            ? "Nhà hàng này không tồn tại hoặc chưa được công khai."
            : "Không thể tải thông tin nhà hàng. Vui lòng thử lại.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadRestaurant();
    return () => {
      active = false;
    };
  }, [restaurantSlug]);

  useEffect(() => {
    let active = true;
    const loadMenu = async () => {
      setMenuLoading(true);
      setMenuError("");
      try {
        const params = new URLSearchParams({
          limit: "50",
          availability: "all",
        });
        if (selectedCategory) params.set("category", selectedCategory);
        if (menuSearch) params.set("q", menuSearch);
        const response = await api.get<{ data: MenuItem[] }>(
          `/public/restaurants/${restaurantSlug}/menu-items`,
          { params },
        );
        if (active) setMenuItems(response.data.data);
      } catch {
        if (active) setMenuError("Không thể tải thực đơn của quán.");
      } finally {
        if (active) setMenuLoading(false);
      }
    };
    void loadMenu();
    return () => {
      active = false;
    };
  }, [menuSearch, restaurantSlug, selectedCategory]);

  useEffect(() => {
    let active = true;
    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError("");
      try {
        const params = new URLSearchParams({
          page: String(reviewPage),
          limit: "5",
          sort: "newest",
        });
        if (reviewRating) params.set("rating", String(reviewRating));
        const response = await api.get<ReviewResponse>(
          `/public/restaurants/${restaurantSlug}/reviews`,
          { params },
        );
        if (!active) return;
        setReviews(response.data.data);
        setReviewPagination(response.data.pagination);
        setReviewSummary(response.data.summary);
      } catch {
        if (active) setReviewsError("Không thể tải đánh giá của nhà hàng.");
      } finally {
        if (active) setReviewsLoading(false);
      }
    };
    void loadReviews();
    return () => {
      active = false;
    };
  }, [restaurantSlug, reviewPage, reviewRating]);

  const currentRestaurantCart =
    restaurant && cart?.restaurantId._id === restaurant._id ? cart : null;
  const cartItems = currentRestaurantCart?.items ?? [];
  const cartQuantity = cartItems.reduce(
    (total: number, entry: CartItem) => total + entry.quantity,
    0,
  );
  const cartSubtotal = currentRestaurantCart?.subtotal ?? 0;

  const submitMenuSearch = (event: FormEvent) => {
    event.preventDefault();
    setMenuSearch(draftMenuSearch.trim());
  };

  const handleAddItem = async (item: MenuItem, replace = false) => {
    if (!isAuthenticated) {
      setLoginItem(item.name);
      return;
    }
    if (!restaurant) return;

    const payload: AddToCartPayload = {
      restaurantId: restaurant._id,
      menuItemId: item._id,
      quantity: 1,
      replace,
    };

    try {
      await addItemToCart(payload);
      // Success is handled by cart context updating
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message);
        setPendingItemPayload(payload);
      } else {
        alert(err.response?.data?.message || "Thêm vào giỏ hàng thất bại.");
      }
    }
  };

  const handleUpdateQuantity = async (
    menuItemId: string,
    newQuantity: number,
  ) => {
    try {
      if (newQuantity > 0) {
        await api.patch(`/cart/items/${menuItemId}`, { quantity: newQuantity });
      } else {
        // quantity <= 0 means remove
        await api.delete(`/cart/items/${menuItemId}`);
      }
      fetchCart();
    } catch (error) {
      console.error("Failed to update quantity:", error);
      alert("Lỗi cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf7]">
        <div className="h-[360px] animate-pulse bg-slate-200" />
        <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1180px] grid-cols-[1fr_330px] gap-8 py-10 max-[760px]:grid-cols-1">
          <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
          <div className="h-[320px] animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f7faf7] px-5 py-16 text-center">
        <div className="max-w-lg rounded-3xl border border-[#e7ece8] bg-white px-8 py-12 shadow-sm">
          <Store className="mx-auto mb-5 h-14 w-14 text-[#ff5a1f]" />
          <h1 className="mb-3 text-3xl font-extrabold text-[#17201a]">
            Không tìm thấy quán
          </h1>
          <p className="mb-7 text-[#68736c]">{error}</p>
          <Link
            to="/restaurants"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff5a1f] px-5 font-bold text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  const summary = reviewSummary ?? restaurant.ratingSummary;
  const deliveryTotal =
    cartSubtotal + (cartItems.length > 0 ? restaurant.delivery.fee : 0);

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#17201a]">
      <section className="relative h-[360px] overflow-hidden max-[760px]:h-[470px]">
        <img
          src={`${SERVER_STATIC_ASSET_BASE_URL}${restaurant.coverUrl || "/assets/restaurant.jpg"}`}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0d1811]/55" />
        <div className="absolute inset-0 flex items-end pb-10 text-white max-[760px]:pb-7">
          <div className="mx-auto flex w-[calc(100%-2.5rem)] max-w-[1180px] items-end justify-between gap-6 max-[760px]:w-[calc(100%-1.5rem)] max-[760px]:flex-col max-[760px]:items-start">
            <div>
              <Link
                to="/restaurants"
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" /> Danh sách nhà hàng
              </Link>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${
                    restaurant.isOpenNow
                      ? "bg-[#e5f8eb] text-[#187a3d]"
                      : "bg-white/90 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${restaurant.isOpenNow ? "bg-[#29b55c]" : "bg-slate-400"}`}
                  />
                  {restaurant.isOpenNow ? "Đang mở cửa" : "Hiện đang đóng cửa"}
                </span>
                {restaurant.cuisineCategories.map((category) => (
                  <span
                    key={category._id}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="mb-4 flex items-center gap-4">
                <img
                  src={
                    restaurant.logoUrl ||
                    restaurant.coverUrl ||
                    "/assets/restaurant.jpg"
                  }
                  alt={`Logo ${restaurant.name}`}
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/80 bg-white object-cover shadow-lg max-[600px]:h-14 max-[600px]:w-14"
                />
                <h1 className="mb-0 text-[42px] font-extrabold leading-tight tracking-[-.04em] max-[760px]:text-[34px]">
                  {restaurant.name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-x-7 gap-y-2.5 text-xs font-semibold text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {summary.average.toFixed(1)} ({formatCount(summary.count)}{" "}
                  đánh giá)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {restaurant.address.formatted}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />{" "}
                  {restaurant.delivery.minMinutes}–
                  {restaurant.delivery.maxMinutes} phút
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFavorite((value) => !value)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-5 font-bold transition hover:-translate-y-0.5 ${
                favorite
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-white/70 bg-white text-[#17201a]"
              }`}
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
              {favorite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-[#e7ece8] bg-white/95 backdrop-blur">
        <nav className="mx-auto flex w-[calc(100%-2.5rem)] max-w-[1180px] gap-7 overflow-x-auto max-[760px]:w-[calc(100%-1.5rem)]">
          {[
            ["menu", "Thực đơn"],
            ["about", "Thông tin"],
            ["reviews", `Đánh giá (${formatCount(summary.count)})`],
          ].map(([id, label], index) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={`shrink-0 border-0 border-b-[3px] bg-transparent px-0 py-4 text-xs font-bold ${
                index === 0
                  ? "border-[#ff5a1f] text-[#ff5a1f]"
                  : "border-transparent text-[#68736c]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <section id="menu" className="scroll-mt-32 py-10">
        <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1180px] grid-cols-[minmax(0,1fr)_330px] items-start gap-8 max-[900px]:grid-cols-1 max-[760px]:w-[calc(100%-1.5rem)]">
          <div className="min-w-0">
            <div className="mb-6 flex items-end justify-between gap-5 max-[760px]:flex-col max-[760px]:items-stretch">
              <div>
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2eae62]">
                  Thực đơn hôm nay
                </div>
                <h2 className="mb-0 text-3xl font-extrabold tracking-[-.03em]">
                  Món ngon của quán
                </h2>
              </div>
              <form
                onSubmit={submitMenuSearch}
                className="flex min-w-[280px] items-center rounded-xl border border-[#e7ece8] bg-white px-3 focus-within:border-[#ff5a1f] max-[760px]:min-w-0"
              >
                <Search className="h-4 w-4 text-[#9ca59f]" />
                <input
                  value={draftMenuSearch}
                  onChange={(event) => setDraftMenuSearch(event.target.value)}
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-xs outline-none"
                  placeholder="Tìm món trong quán..."
                  aria-label="Tìm món trong quán"
                />
              </form>
            </div>

            <div className="mb-6 flex gap-2.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  selectedCategory === ""
                    ? "border-[#ff5a1f] bg-[#ff5a1f] text-white"
                    : "border-[#e7ece8] bg-white text-[#68736c] hover:border-[#ff5a1f] hover:text-[#ff5a1f]"
                }`}
              >
                Tất cả
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                    selectedCategory === category.slug
                      ? "border-[#ff5a1f] bg-[#ff5a1f] text-white"
                      : "border-[#e7ece8] bg-white text-[#68736c] hover:border-[#ff5a1f] hover:text-[#ff5a1f]"
                  }`}
                >
                  {category.name} · {category.itemCount}
                </button>
              ))}
            </div>

            {menuLoading && (
              <div className="rounded-2xl border border-[#e7ece8] bg-white px-6 py-14 text-center text-[#68736c]">
                Đang chuẩn bị thực đơn...
              </div>
            )}
            {menuError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600">
                {menuError}
              </div>
            )}
            {!menuLoading && !menuError && menuItems.length === 0 && (
              <div className="rounded-2xl border border-[#e7ece8] bg-white px-6 py-14 text-center text-[#68736c]">
                <span className="mb-3 block text-4xl">🍽️</span>
                Không tìm thấy món phù hợp.
              </div>
            )}
            {!menuLoading && !menuError && menuItems.length > 0 && (
              <div className="grid gap-3.5">
                {menuItems.map((item) => (
                  <article
                    key={item._id}
                    className={`grid grid-cols-[125px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-[#e7ece8] bg-white p-3 shadow-[0_5px_18px_rgba(34,63,43,.035)] transition hover:border-[#cfe6d5] hover:shadow-md max-[600px]:grid-cols-[88px_minmax(0,1fr)_auto] ${
                      item.isAvailable ? "" : "opacity-65"
                    }`}
                  >
                    <Link
                      to={`/restaurants/${restaurant.slug}/menu-items/${item.slug}`}
                      className="relative block overflow-hidden rounded-xl"
                    >
                      <img
                        src={`${SERVER_STATIC_ASSET_BASE_URL}${item.imageUrls?.[0] || "/assets/noodles.jpg"}`}
                        alt={item.name}
                        className="h-24 w-[125px] object-cover max-[600px]:h-20 max-[600px]:w-[88px]"
                      />
                      {!item.isAvailable && (
                        <span className="absolute inset-0 grid place-items-center bg-slate-900/55 text-[10px] font-extrabold uppercase text-white">
                          Hết món
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Link
                          to={`/restaurants/${restaurant.slug}/menu-items/${item.slug}`}
                          className="min-w-0"
                        >
                          <h3 className="mb-0 truncate text-[15px] font-bold transition hover:text-[#ff5a1f]">
                            {item.name}
                          </h3>
                        </Link>
                        {item.soldCount > 100 && (
                          <span className="rounded-md bg-[#fff0e9] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#ff5a1f]">
                            Bán chạy
                          </span>
                        )}
                      </div>
                      <p className="mb-2 line-clamp-2 text-xs text-[#68736c]">
                        {item.shortDescription}
                      </p>
                      <div>
                        <b className="text-[16px] text-[#ff5a1f]">
                          {formatMoney(item.effectivePrice)}
                        </b>
                        {item.salePrice !== null && (
                          <span className="ml-2 text-[11px] text-[#9ca59f] line-through">
                            {formatMoney(item.basePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => handleAddItem(item)}
                      className="grid h-9 w-9 place-items-center rounded-xl border-0 bg-[#ff5a1f] text-white transition hover:scale-105 hover:bg-[#e94e16] disabled:cursor-not-allowed disabled:bg-slate-300"
                      aria-label={`Thêm ${item.name} vào giỏ`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}

            <section id="about" className="scroll-mt-32 pt-14">
              <div className="mb-6">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2eae62]">
                  Câu chuyện của quán
                </div>
                <h2 className="mb-0 text-3xl font-extrabold tracking-[-.03em]">
                  Thông tin nhà hàng
                </h2>
              </div>
              <div className="rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-sm">
                <p className="mb-6 leading-7 text-[#68736c]">
                  {restaurant.description}
                </p>
                <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
                  <div className="flex gap-3 rounded-xl bg-[#f7faf7] p-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5a1f]" />
                    <div>
                      <b className="block text-xs">Địa chỉ</b>
                      <span className="text-xs text-[#68736c]">
                        {restaurant.address.formatted}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex gap-3 rounded-xl bg-[#f7faf7] p-4 transition hover:bg-[#fff0e9]"
                  >
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5a1f]" />
                    <div>
                      <b className="block text-xs">Điện thoại</b>
                      <span className="text-xs text-[#68736c]">
                        {restaurant.phone}
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </section>

            <section id="reviews" className="scroll-mt-32 pt-14">
              <div className="mb-6 flex items-end justify-between gap-4 max-[600px]:items-start">
                <div>
                  <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2eae62]">
                    Trải nghiệm thực tế
                  </div>
                  <h2 className="mb-1 text-3xl font-extrabold tracking-[-.03em]">
                    Khách hàng nói gì
                  </h2>
                  <p className="mb-0 text-xs text-[#68736c]">
                    Điểm trung bình {summary.average.toFixed(1)} từ{" "}
                    {formatCount(summary.count)} đánh giá
                  </p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-[170px_1fr] gap-7 rounded-2xl border border-[#e7ece8] bg-white p-6 max-[600px]:grid-cols-1">
                <div className="grid place-items-center border-r border-[#e7ece8] text-center max-[600px]:border-b max-[600px]:border-r-0 max-[600px]:pb-5">
                  <strong className="text-5xl font-black tracking-[-.05em]">
                    {summary.average.toFixed(1)}
                  </strong>
                  <div
                    className="my-2 flex gap-0.5 text-amber-400"
                    aria-label={`${summary.average} trên 5 sao`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < Math.round(summary.average) ? "fill-current" : ""}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#68736c]">
                    {formatCount(summary.count)} lượt đánh giá
                  </span>
                </div>
                <div className="grid gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count =
                      summary.distribution[
                        String(rating) as keyof RatingSummary["distribution"]
                      ] ?? 0;
                    const percentage =
                      summary.count > 0 ? (count / summary.count) * 100 : 0;
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => {
                          setReviewRating((current) =>
                            current === rating ? null : rating,
                          );
                          setReviewPage(1);
                        }}
                        className={`grid grid-cols-[42px_1fr_42px] items-center gap-3 rounded-lg border-0 px-2 py-1 text-left text-[11px] transition ${reviewRating === rating ? "bg-[#fff0e9]" : "bg-transparent hover:bg-[#f7faf7]"}`}
                      >
                        <span className="font-bold">{rating} sao</span>
                        <span className="h-2 overflow-hidden rounded-full bg-[#eef2ef]">
                          <span
                            className="block h-full rounded-full bg-amber-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </span>
                        <span className="text-right text-[#68736c]">
                          {formatCount(count)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {reviewsLoading && (
                <div className="rounded-2xl border border-[#e7ece8] bg-white p-10 text-center text-[#68736c]">
                  Đang tải đánh giá...
                </div>
              )}
              {reviewsError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
                  {reviewsError}
                </div>
              )}
              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <div className="rounded-2xl border border-[#e7ece8] bg-white p-10 text-center text-[#68736c]">
                  {reviewRating
                    ? `Chưa có đánh giá ${reviewRating} sao.`
                    : "Nhà hàng chưa có đánh giá công khai."}
                </div>
              )}
              {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[#e7ece8] bg-white px-6">
                  {reviews.map((review) => (
                    <article
                      key={review._id}
                      className="grid grid-cols-[44px_1fr] gap-3.5 border-b border-[#e7ece8] py-5 last:border-b-0"
                    >
                      {review.customer.avatarUrl ? (
                        <img
                          src={review.customer.avatarUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dff7e7] text-xs font-extrabold text-[#167a3e]">
                          {getInitials(review.customer.fullName)}
                        </span>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <b className="text-sm">{review.customer.fullName}</b>
                          <span className="text-[11px] text-[#9ca59f]">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="my-1.5 flex gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : ""}`}
                            />
                          ))}
                        </div>
                        <p className="mb-0 text-sm leading-6 text-[#526158]">
                          {review.content}
                        </p>
                        {review.ownerReply && (
                          <div className="mt-3 rounded-xl bg-[#f7faf7] p-3 text-xs text-[#68736c]">
                            <b className="mb-1 block text-[#17201a]">
                              Phản hồi từ {restaurant.name}
                            </b>
                            {review.ownerReply.content}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {reviewPagination.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={reviewPage === 1}
                    onClick={() => setReviewPage((page) => page - 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#e7ece8] bg-white disabled:opacity-40"
                    aria-label="Trang đánh giá trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-xs font-bold">
                    {reviewPage} / {reviewPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={reviewPage === reviewPagination.totalPages}
                    onClick={() => setReviewPage((page) => page + 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-[#e7ece8] bg-white disabled:opacity-40"
                    aria-label="Trang đánh giá sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>
          </div>

          <aside className="sticky top-[138px] overflow-hidden rounded-2xl border border-[#e7ece8] bg-white shadow-[0_8px_24px_rgba(34,63,43,.08)] max-[900px]:static">
            <div className="border-b border-[#e7ece8] p-5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="mb-0 flex items-center gap-2 text-lg font-extrabold">
                  <ShoppingBag className="h-5 w-5 text-[#ff5a1f]" /> Giỏ hàng
                  của bạn
                </h3>
                {cartQuantity > 0 && (
                  <span className="rounded-full bg-[#fff0e9] px-2.5 py-1 text-[10px] font-extrabold text-[#ff5a1f]">
                    {cartQuantity} món
                  </span>
                )}
              </div>
              <p className="mb-0 text-[11px] text-[#68736c]">
                {restaurant.name}
              </p>
            </div>
            <div className="p-5">
              {cart &&
                cart.items.length > 0 &&
                cart.restaurantId._id !== restaurant._id && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
                    Giỏ hàng hiện có{" "}
                    {cart.items.reduce((sum, entry) => sum + entry.quantity, 0)}{" "}
                    món từ <b>{cart.restaurantId.name}</b>. Khi chọn món ở đây,
                    hệ thống sẽ hỏi trước khi đổi quán.
                  </div>
                )}
              {cartItems.length === 0 ? (
                <div className="py-5 text-center">
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e9] text-2xl">
                    🥡
                  </span>
                  <b className="block text-sm">Giỏ hàng đang trống</b>
                  <p className="mb-0 mt-1 text-[11px] text-[#68736c]">
                    Chọn món ngon ở thực đơn để bắt đầu.
                  </p>
                </div>
              ) : (
                <div className="mb-4 max-h-[280px] overflow-y-auto pr-1">
                  {cartItems.map((cartItem) => (
                    <div
                      key={cartItem.menuItemId._id}
                      className="border-b border-dashed border-[#e7ece8] py-3 first:pt-0"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3 text-xs">
                        <span className="font-bold">
                          {cartItem.menuItemId.name}
                        </span>
                        <b className="shrink-0">
                          {formatMoney(cartItem.price * cartItem.quantity)}
                        </b>
                      </div>
                      {/* Options are not handled in this quick-add view */}
                      {/* {cartItem.options.length > 0 && (
                        <p className="mb-2 text-[10px] leading-4 text-[#68736c]">
                          {cartItem.options.map((option) => option.optionName).join(' · ')}
                        </p>
                      )} */}
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#e7ece8]">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              cartItem.menuItemId._id,
                              cartItem.quantity - 1,
                            )
                          }
                          className="grid h-7 w-7 place-items-center bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={cartItem.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="grid h-7 min-w-7 place-items-center text-[11px] font-bold">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              cartItem.menuItemId._id,
                              cartItem.quantity + 1,
                            )
                          }
                          className="grid h-7 w-7 place-items-center bg-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-4 rounded-xl bg-[#f7faf7] p-3 text-xs">
                <div className="mb-2 flex justify-between text-[#68736c]">
                  <span>Tạm tính</span>
                  <b className="text-[#17201a]">{formatMoney(cartSubtotal)}</b>
                </div>
                <div className="mb-3 flex justify-between text-[#68736c]">
                  <span>Phí giao hàng</span>
                  <b className="text-[#17201a]">
                    {restaurant.delivery.fee === 0
                      ? "Miễn phí"
                      : formatMoney(restaurant.delivery.fee)}
                  </b>
                </div>
                <div className="flex justify-between border-t border-[#e7ece8] pt-3 text-sm">
                  <b>Tổng cộng</b>
                  <b className="text-[#ff5a1f]">{formatMoney(deliveryTotal)}</b>
                </div>
              </div>
              <Link
                to={cartItems.length > 0 ? "/cart" : "#menu"}
                onClick={(event) => {
                  if (cartItems.length === 0) {
                    event.preventDefault();
                    scrollToSection("menu");
                  }
                }}
                className={`flex min-h-11 w-full items-center justify-center rounded-xl font-bold text-white transition ${cartItems.length > 0 ? "bg-[#ff5a1f] hover:-translate-y-0.5 hover:bg-[#e94e16]" : "bg-slate-300"}`}
              >
                {cartItems.length > 0 ? "Xem giỏ hàng" : "Chọn món ngay"}
              </Link>
            </div>

            <div className="border-t border-[#e7ece8] bg-[#fbfdfb] p-5">
              <div className="mb-3 flex items-start gap-3 text-xs">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#2eae62]" />
                <span>
                  <b className="block">
                    Giao trong {restaurant.delivery.minMinutes}–
                    {restaurant.delivery.maxMinutes} phút
                  </b>
                  <span className="text-[#68736c]">
                    Bán kính tối đa {restaurant.delivery.maxDistanceKm ?? 8} km
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2eae62]" />
                <span>
                  <b className="block">Giờ hoạt động</b>
                  <span className="text-[#68736c]">
                    {PRICE_LABELS[restaurant.priceRange]}
                  </span>
                </span>
              </div>
              <div className="mt-4 grid gap-1.5 border-t border-[#e7ece8] pt-4 text-[11px]">
                {restaurant.openingHours.map((entry) => (
                  <div
                    key={entry.dayOfWeek}
                    className="flex justify-between gap-3 text-[#68736c]"
                  >
                    <span>{DAY_NAMES[entry.dayOfWeek]}</span>
                    <b className="text-[#17201a]">
                      {entry.isClosed || entry.slots.length === 0
                        ? "Đóng cửa"
                        : entry.slots
                            .map((slot) => `${slot.open}–${slot.close}`)
                            .join(", ")}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <LoginModal
        isOpen={Boolean(loginItem)}
        onClose={() => setLoginItem("")}
        itemName={loginItem}
      />
      <RestaurantChangeModal
        isOpen={Boolean(pendingItemPayload)}
        currentRestaurantName={
          /"(.*?)"/.exec(conflictError)?.[1] || "quán khác"
        }
        nextRestaurantName={restaurant.name}
        onCancel={() => {
          setPendingItemPayload(null);
          setConflictError("");
        }}
        onConfirm={async () => {
          if (pendingItemPayload)
            await handleAddItem(
              { _id: pendingItemPayload.menuItemId } as MenuItem,
              true,
            );
          setPendingItemPayload(null);
          setConflictError("");
        }}
      />
    </main>
  );
};
