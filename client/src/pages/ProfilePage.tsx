import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../utils/api";
import { User, MapPin, Heart, Plus, Trash2, Save, Loader2, Phone, Mail } from "lucide-react";
import { RestaurantCard, RestaurantCardData } from "../components/cards/RestaurantCard";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Nhà riêng",
    recipientName: user?.fullName || "",
    phone: user?.phone || "",
    line1: "",
    ward: "",
    district: "",
    city: "Hà Nội",
    isDefault: false,
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState<RestaurantCardData[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "profile");
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setAddresses(user.addresses || []);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchFavorites();
    }
  }, [activeTab]);

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await api.get<{ data: RestaurantCardData[] }>("/users/me/favorites");
      setFavorites(res.data.data);
    } catch (error) {
      console.error("Failed to load favorites", error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await api.patch("/users/me", { fullName, phone });
      updateUser(res.data.user);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAddress(true);
    try {
      const res = await api.post("/users/me/addresses", newAddress);
      updateUser(res.data.user);
      setAddresses(res.data.user.addresses);
      setShowAddressModal(false);
      toast.success("Thêm địa chỉ thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thêm địa chỉ thất bại.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await api.delete(`/users/me/addresses/${addressId}`);
      if (user) {
        updateUser({ ...user, addresses: res.data.addresses });
      }
      setAddresses(res.data.addresses);
      toast.success("Đã xóa địa chỉ.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Xóa thất bại.");
    }
  };

  const handleToggleFavorite = async (restaurantId: string) => {
    try {
      await api.post(`/users/me/favorites/${restaurantId}`);
      fetchFavorites();
      toast.success("Đã cập nhật yêu thích.");
    } catch {
      toast.error("Lỗi cập nhật yêu thích.");
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await api.post("/auth/resend-verification");
      toast.success(res.data.message || "Đã gửi lại email xác thực.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi email. Vui lòng thử lại.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {user?.status === "pending_verification" && (
          <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600 mt-0.5">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800">Tài khoản chưa được xác thực</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Bạn cần xác thực email để có thể đặt hàng và sử dụng đầy đủ các tính năng.
                </p>
              </div>
            </div>
            <button
              onClick={handleResendVerification}
              className="whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
            >
              Gửi lại email kích hoạt
            </button>
          </div>
        )}

        {/* Profile Banner */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 relative">
          {user?.status === "pending_verification" && (
            <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md">
              CHƯA KÍCH HOẠT
            </span>
          )}
          {user?.status === "active" && (
            <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md">
              ĐÃ KÍCH HOẠT
            </span>
          )}
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-orange-500 text-3xl font-black text-white shadow-lg shadow-orange-500/30">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-extrabold text-slate-800">
              {user?.fullName}
            </h1>
            <p className="text-sm font-medium text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="h-4 w-4" /> {user?.email}
            </p>
          </div>
        </div>

        {/* Tabs Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Sidebar Nav */}
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto rounded-2xl bg-white p-2 border border-slate-100 shadow-sm">
            <button
              onClick={() => setSearchParams({ tab: "profile" })}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition shrink-0 ${
                activeTab === "profile"
                  ? "bg-[#ff5a1f] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: "addresses" })}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition shrink-0 ${
                activeTab === "addresses"
                  ? "bg-[#ff5a1f] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Địa chỉ giao hàng</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: "favorites" })}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition shrink-0 ${
                activeTab === "favorites"
                  ? "bg-[#ff5a1f] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Quán yêu thích</span>
            </button>
          </nav>

          {/* Tab Content */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 min-h-[400px]">
            {/* Tab 1: Profile */}
            {activeTab === "profile" && (
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-3 border-b border-slate-100">
                  Thông tin tài khoản
                </h2>
                <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5a1f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5a1f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email (không thể đổi)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex items-center gap-2 rounded-xl bg-[#ff5a1f] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#e94e16] disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Addresses */}
            {activeTab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-800">
                    Địa chỉ giao hàng
                  </h2>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#ff5a1f] px-4 py-2 text-xs font-bold text-white hover:bg-[#e94e16]"
                  >
                    <Plus className="h-4 w-4" /> Thêm địa chỉ
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Chưa có địa chỉ nào được lưu.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-[#ff5a1f]">
                              {addr.label}
                            </span>
                            <b className="text-sm text-slate-800">
                              {addr.recipientName} ({addr.phone})
                            </b>
                          </div>
                          <p className="text-xs text-slate-600">
                            {addr.line1}, {addr.ward}, {addr.district}, {addr.city}
                          </p>
                        </div>

                        {addr._id && (
                          <button
                            onClick={() => handleDeleteAddress(addr._id!)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Favorites */}
            {activeTab === "favorites" && (
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 pb-3 border-b border-slate-100">
                  Nhà hàng yêu thích
                </h2>

                {loadingFavorites ? (
                  <div className="py-12 text-center text-slate-400">
                    Đang tải danh sách yêu thích...
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Bạn chưa yêu thích nhà hàng nào.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favorites.map((resto) => (
                      <RestaurantCard
                        key={resto._id}
                        restaurant={resto}
                        isFavorite={true}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">
              Thêm địa chỉ giao hàng
            </h3>
            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhãn địa chỉ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhà riêng, Công ty..."
                  value={newAddress.label}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, label: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên người nhận & SĐT
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Họ tên"
                    value={newAddress.recipientName}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        recipientName: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="SĐT"
                    value={newAddress.phone}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, phone: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, Tên đường)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123 Đường Cầu Giấy"
                  value={newAddress.line1}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, line1: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Phường/Xã"
                  value={newAddress.ward}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, ward: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Quận/Huyện"
                  value={newAddress.district}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, district: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Tỉnh/TP"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, city: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="rounded-xl bg-[#ff5a1f] px-5 py-2 text-xs font-bold text-white hover:bg-[#e94e16]"
                >
                  {isAddingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
