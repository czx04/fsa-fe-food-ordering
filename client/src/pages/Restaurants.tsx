import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { RestaurantCard, RestaurantCardData } from "../components/cards/RestaurantCard";
import { Pagination } from "../components/ui/Pagination";
import { Button } from "../components/ui/Button";
import {
  Search,
  Filter,
  MapPin,
  Map,
  List,
  Utensils,
  Star,
} from "lucide-react";

interface CuisineCategory {
  _id: string;
  name: string;
  slug: string;
}

interface RestaurantResponse {
  data: RestaurantCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PRICE_OPTIONS = [
  { value: "budget", label: "Dưới 100.000đ" },
  { value: "mid", label: "100.000đ – 200.000đ" },
  { value: "premium", label: "Trên 200.000đ" },
] as const;

const RATING_OPTIONS = [4.5, 4, 3.5];

const CONTAINER_CLASS =
  "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] max-[760px]:w-[calc(100%-1.5rem)]";
const FORM_CONTROL_CLASS =
  "h-[44px] min-w-[155px] rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-xs font-semibold max-[760px]:w-full";
const FILTER_LABEL_CLASS =
  "my-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900";

const getMapPosition = (restaurant: RestaurantCardData) => {
  const address = typeof restaurant.address === 'string' ? restaurant.address : '';
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const left = Math.min(90, Math.max(10, (hash % 80) + 10));
  const top = Math.min(85, Math.max(15, ((hash * 3) % 70) + 15));
  return { left: `${left}%`, top: `${top}%` };
};

export const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<CuisineCategory[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantCardData[]>([]);
  const [pagination, setPagination] = useState<RestaurantResponse["pagination"]>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [draftSearch, setDraftSearch] = useState(searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const selectedCuisines = useMemo(
    () => (searchParams.get("cuisine") ?? "").split(",").filter(Boolean),
    [searchParams],
  );
  const district = searchParams.get("district") ?? "";
  const city = searchParams.get("city") ?? "TP.HCM";
  const openOnly = searchParams.get("openNow") !== "false";

  useEffect(() => {
    let active = true;
    api
      .get<CuisineCategory[]>("/public/categories")
      .then((response) => {
        if (active) setCategories(response.data);
      })
      .catch(() => {
        if (active) setError("Không thể tải danh mục ẩm thực.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchRestaurants = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams(searchParams);
        if (!params.has("sort")) params.set("sort", "popular_desc");
        if (!params.has("openNow")) params.set("openNow", "true");
        if (!params.has("limit")) params.set("limit", "9");
        const response = await api.get<RestaurantResponse>(
          "/public/restaurants",
          { params },
        );
        if (!active) return;
        setRestaurants(response.data.data);
        setPagination(response.data.pagination);
      } catch {
        if (active)
          setError("Không thể tải danh sách nhà hàng. Vui lòng thử lại.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchRestaurants();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    if (!Object.hasOwn(updates, "page")) next.set("page", "1");
    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateParams({ q: draftSearch.trim() || null });
  };

  const toggleCuisine = (slug: string) => {
    const next = selectedCuisines.includes(slug)
      ? selectedCuisines.filter((item) => item !== slug)
      : [...selectedCuisines, slug];
    updateParams({ cuisine: next.length > 0 ? next.join(",") : null });
  };

  const resetFilters = () => {
    setDraftSearch("");
    setSearchParams({ sort: "popular_desc", openNow: "true", page: "1" });
  };

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-800">
      {/* Header Banner */}
      <section className="bg-orange-50/70 border-b border-slate-100 py-10">
        <div className={CONTAINER_CLASS}>
          <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-orange-600">
            Khám phá vị ngon
          </div>
          <h1 className="mb-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Nhà hàng gần bạn
          </h1>
          <p className="text-slate-500 text-sm">
            {loading
              ? "Đang tìm những lựa chọn phù hợp..."
              : `${pagination.total} nhà hàng${openOnly ? " đang mở" : ""}${district ? ` tại ${district}, ${city}` : ` tại ${city}`}`}
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className={CONTAINER_CLASS}>
          {/* Search Controls */}
          <form
            className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
            onSubmit={submitSearch}
          >
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                className="w-full h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-orange-500"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Tìm tên nhà hàng hoặc địa chỉ..."
                aria-label="Tìm tên nhà hàng hoặc địa chỉ"
              />
            </div>
            <select
              className={FORM_CONTROL_CLASS}
              value={district ? `${district}|${city}` : ""}
              onChange={(event) => {
                const [nextDistrict, nextCity] = event.target.value.split("|");
                updateParams({
                  district: nextDistrict || null,
                  city: nextCity || null,
                });
              }}
              aria-label="Khu vực"
            >
              <option value="">Tất cả khu vực</option>
              <option value="Quận 1|TP.HCM">Quận 1, TP.HCM</option>
              <option value="Quận 3|TP.HCM">Quận 3, TP.HCM</option>
            </select>
            <select
              className={FORM_CONTROL_CLASS}
              value={searchParams.get("sort") ?? "popular_desc"}
              onChange={(event) => updateParams({ sort: event.target.value })}
              aria-label="Sắp xếp"
            >
              <option value="popular_desc">Sắp xếp: Phổ biến</option>
              <option value="rating_desc">Đánh giá cao</option>
              <option value="delivery_asc">Giao nhanh nhất</option>
              <option value="price_asc">Giá thấp trước</option>
              <option value="newest">Mới nhất</option>
            </select>
            <Button type="submit" variant="primary" size="md">
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </Button>
          </form>

          <Button
            variant="outline"
            className="mb-4 sm:hidden w-full"
            onClick={() => setShowMobileFilters((value) => !value)}
          >
            <Filter className="w-4 h-4" />
            <span>{showMobileFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}</span>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] items-start gap-6">
            {/* Sidebar Filters */}
            <aside
              className={`sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${
                showMobileFilters ? "block" : "hidden md:block"
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <b className="text-sm text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-500" />
                  Bộ lọc
                </b>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-xs font-bold text-orange-600 hover:underline"
                  onClick={resetFilters}
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Categories Filter */}
              <div className="border-b border-slate-100 py-4">
                <h4 className="mb-2 font-bold text-xs text-slate-700">Loại ẩm thực</h4>
                {categories.map((category) => (
                  <label className={FILTER_LABEL_CLASS} key={category._id}>
                    <input
                      className="h-4 w-4 rounded accent-orange-500"
                      type="checkbox"
                      checked={selectedCuisines.includes(category.slug)}
                      onChange={() => toggleCuisine(category.slug)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>

              {/* Price Filter */}
              <div className="border-b border-slate-100 py-4">
                <h4 className="mb-2 font-bold text-xs text-slate-700">Khoảng giá</h4>
                {PRICE_OPTIONS.map((option) => (
                  <label className={FILTER_LABEL_CLASS} key={option.value}>
                    <input
                      className="h-4 w-4 accent-orange-500"
                      type="radio"
                      name="price"
                      checked={searchParams.get("priceRange") === option.value}
                      onChange={() =>
                        updateParams({ priceRange: option.value })
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              {/* Rating Filter */}
              <div className="border-b border-slate-100 py-4">
                <h4 className="mb-2 font-bold text-xs text-slate-700">Đánh giá</h4>
                {RATING_OPTIONS.map((rating) => (
                  <label className={FILTER_LABEL_CLASS} key={rating}>
                    <input
                      className="h-4 w-4 accent-orange-500"
                      type="radio"
                      name="rating"
                      checked={searchParams.get("minRating") === String(rating)}
                      onChange={() =>
                        updateParams({ minRating: String(rating) })
                      }
                    />
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rating} sao trở lên
                    </span>
                  </label>
                ))}
              </div>

              <div className="pt-4 space-y-2">
                <label className={FILTER_LABEL_CLASS}>
                  <input
                    className="h-4 w-4 rounded accent-orange-500"
                    type="checkbox"
                    checked={openOnly}
                    onChange={(event) =>
                      updateParams({ openNow: String(event.target.checked) })
                    }
                  />
                  <span>Chỉ quán đang mở</span>
                </label>
                <label className={FILTER_LABEL_CLASS}>
                  <input
                    className="h-4 w-4 rounded accent-orange-500"
                    type="checkbox"
                    checked={searchParams.get("freeDelivery") === "true"}
                    onChange={(event) =>
                      updateParams({
                        freeDelivery: event.target.checked ? "true" : null,
                      })
                    }
                  />
                  <span>Miễn phí giao hàng</span>
                </label>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <b className="text-sm text-slate-800">{pagination.total} kết quả</b>
                  <div className="text-xs text-slate-400">
                    Kết quả phù hợp nhất với bạn
                  </div>
                </div>
                <Button
                  variant={showMap ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowMap((value) => !value)}
                >
                  {showMap ? (
                    <>
                      <List className="w-4 h-4" />
                      <span>Danh sách</span>
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4" />
                      <span>Bản đồ</span>
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600 text-sm font-medium">
                  {error}
                </div>
              )}
              {loading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400 text-sm">
                  Đang tải danh sách nhà hàng...
                </div>
              )}

              {/* Map View */}
              {!loading && !error && showMap && restaurants.length > 0 && (
                <div
                  className="relative min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-orange-50/50 shadow-sm"
                  aria-label="Bản đồ nhà hàng"
                >
                  {restaurants.map((restaurant) => (
                    <button
                      className="absolute z-10 grid max-w-[140px] -translate-x-1/2 -translate-y-1/2 cursor-pointer justify-items-center gap-1 border-0 bg-transparent"
                      key={restaurant._id}
                      style={getMapPosition(restaurant)}
                      title={restaurant.name}
                      type="button"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-500 text-white shadow-md">
                        <MapPin className="w-5 h-5" />
                      </span>
                      <b className="rounded-lg bg-white px-2 py-0.5 text-[10px] shadow-sm border border-slate-100 font-bold text-slate-800 truncate max-w-[120px]">
                        {restaurant.name}
                      </b>
                    </button>
                  ))}
                </div>
              )}

              {/* Grid List View */}
              {!loading && !error && !showMap && restaurants.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && restaurants.length === 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-500 space-y-4">
                  <Utensils className="w-12 h-12 text-orange-400 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Chưa tìm thấy nhà hàng phù hợp
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy thử đổi từ khóa hoặc bỏ bớt bộ lọc.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Xóa bộ lọc
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => updateParams({ page: String(page) })}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
