import axios from "axios";
import {
  Check,
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { LoginModal } from "../components/LoginModal";
import { RestaurantChangeModal } from "../components/RestaurantChangeModal";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { api } from "../utils/api";
import { SERVER_STATIC_ASSET_BASE_URL } from "../utils/constants";
import { AddToCartPayload } from "../types/cart";

interface ItemOption {
  _id: string;
  name: string;
  priceDelta: number;
}

interface OptionGroup {
  _id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: ItemOption[];
}

interface RelatedItem {
  _id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isAvailable: boolean;
}

interface DishDetailData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string[];
  imageUrls: string[];
  basePrice: number;
  salePrice: number | null;
  effectivePrice: number;
  isAvailable: boolean;
  soldCount: number;
  restaurant: {
    _id: string;
    name: string;
    slug: string;
  };
  menuCategory: {
    _id: string;
    name: string;
    slug: string;
  };
  optionGroups: OptionGroup[];
  relatedItems: RelatedItem[];
}

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

export const DishDetail = () => {
  const { restaurantSlug = "", itemSlug = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const { addItemToCart } = useCart();
  const [item, setItem] = useState<DishDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [selectionError, setSelectionError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");
  const [pendingItemPayload, setPendingItemPayload] =
    useState<AddToCartPayload | null>(null);
  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    let active = true;
    const loadItem = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<{ data: DishDetailData }>(
          `/public/restaurants/${restaurantSlug}/menu-items/${itemSlug}`,
        );
        if (!active) return;
        const detail = response.data.data;
        setItem(detail);
        setActiveImage(0);
        const initialSelections: Record<string, string[]> = {};
        detail.optionGroups.forEach((group) => {
          if (group.required && group.minSelect > 0 && group.options[0]) {
            initialSelections[group._id] = [group.options[0]._id];
          }
        });
        setSelections(initialSelections);
      } catch (requestError) {
        if (!active) return;
        setError(
          axios.isAxiosError(requestError) &&
            requestError.response?.status === 404
            ? "Món ăn không tồn tại hoặc hiện không được công khai."
            : "Không thể tải chi tiết món ăn. Vui lòng thử lại.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadItem();
    return () => {
      active = false;
    };
  }, [itemSlug, restaurantSlug]);

  const selectedOptions = useMemo(() => {
    if (!item) return [];
    return item.optionGroups.flatMap((group) =>
      group.options
        .filter((option) => selections[group._id]?.includes(option._id))
        .map((option) => ({
          groupName: group.name,
          optionName: option.name,
          priceDelta: option.priceDelta,
        })),
    );
  }, [item, selections]);

  const unitPrice =
    (item?.effectivePrice ?? 0) +
    selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const totalPrice = unitPrice * quantity;

  const toggleOption = (group: OptionGroup, optionId: string) => {
    setSelectionError("");
    setSelections((current) => {
      const selected = current[group._id] ?? [];
      if (group.maxSelect === 1) return { ...current, [group._id]: [optionId] };
      if (selected.includes(optionId)) {
        return {
          ...current,
          [group._id]: selected.filter((id) => id !== optionId),
        };
      }
      if (selected.length >= group.maxSelect) return current;
      return { ...current, [group._id]: [...selected, optionId] };
    });
  };

  const handleAddToCart = async (replace = false) => {
    if (!item?.isAvailable) return;
    setSelectionError("");
    setAddedMessage("");

    const invalidGroup = item.optionGroups.find(
      (group) => (selections[group._id]?.length ?? 0) < group.minSelect,
    );
    if (invalidGroup) {
      setSelectionError(
        `Vui lòng chọn đủ tuỳ chọn trong nhóm “${invalidGroup.name}”.`,
      );
      document
        .getElementById(`option-${invalidGroup._id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    const payload: AddToCartPayload = {
      restaurantId: item.restaurant._id,
      menuItemId: item._id,
      quantity,
      replace,
    };

    try {
      await addItemToCart(payload);
      setAddedMessage(`Đã thêm ${quantity} × ${item.name} vào giỏ.`);
      window.setTimeout(() => setAddedMessage(""), 3000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message);
        setPendingItemPayload(payload);
      } else {
        setSelectionError(
          err.response?.data?.message || "Thêm vào giỏ hàng thất bại.",
        );
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf7] py-12">
        <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1180px] grid-cols-2 gap-12 max-[760px]:grid-cols-1">
          <div className="h-[500px] animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f7faf7] px-5 py-16 text-center">
        <div className="max-w-lg rounded-3xl border border-[#e7ece8] bg-white px-8 py-12">
          <Utensils className="mx-auto mb-5 h-14 w-14 text-[#ff5a1f]" />
          <h1 className="mb-3 text-3xl font-extrabold">Không tìm thấy món</h1>
          <p className="mb-7 text-[#68736c]">{error}</p>
          <Link
            to={`/restaurants/${restaurantSlug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ff5a1f] px-5 font-bold text-white hover:bg-[#e94e16]"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại quán
          </Link>
        </div>
      </main>
    );
  }

  const images =
    item.imageUrls.length > 0 ? item.imageUrls : ["/assets/noodles.jpg"];

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#17201a]">
      <section className="border-b border-[#e7ece8] bg-[#eef8f1] py-12 max-[760px]:py-8">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] max-[760px]:w-[calc(100%-1.5rem)]">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#68736c]">
            <Link to="/restaurants" className="hover:text-[#ff5a1f]">
              Nhà hàng
            </Link>
            <span>/</span>
            <Link
              to={`/restaurants/${item.restaurant.slug}`}
              className="hover:text-[#ff5a1f]"
            >
              {item.restaurant.name}
            </Link>
            <span>/</span>
            <span>{item.menuCategory.name}</span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-14 max-[850px]:grid-cols-1">
            <div>
              <div className="overflow-hidden rounded-3xl border border-[#dce8df] bg-white">
                <img
                  src={`${SERVER_STATIC_ASSET_BASE_URL}${images[activeImage]}`}
                  alt={item.name}
                  className="h-[500px] w-full object-cover max-[600px]:h-[340px]"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-0 ${activeImage === index ? "border-[#ff5a1f]" : "border-transparent"}`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#dce8df] bg-white p-7 max-[600px]:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#dff7e7] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#167a3e]">
                  {item.menuCategory.name}
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase ${item.isAvailable ? "bg-[#fff0e9] text-[#ff5a1f]" : "bg-slate-100 text-slate-500"}`}
                >
                  {item.isAvailable ? "Còn món" : "Tạm hết món"}
                </span>
              </div>
              <h1 className="mb-3 text-[40px] font-black leading-tight tracking-[-.04em] max-[600px]:text-[32px]">
                {item.name}
              </h1>
              <p className="mb-4 leading-7 text-[#68736c]">
                {item.description || item.shortDescription}
              </p>
              <div className="mb-6 flex items-end gap-3 border-b border-[#e7ece8] pb-6">
                <strong className="text-3xl font-black text-[#ff5a1f]">
                  {formatMoney(item.effectivePrice)}
                </strong>
                {item.salePrice !== null && (
                  <span className="pb-1 text-sm text-[#9ca59f] line-through">
                    {formatMoney(item.basePrice)}
                  </span>
                )}
                <span className="ml-auto pb-1 text-xs text-[#68736c]">
                  Đã bán {new Intl.NumberFormat("vi-VN").format(item.soldCount)}
                </span>
              </div>

              {item.ingredients.length > 0 && (
                <div className="mb-6 rounded-2xl bg-[#f7faf7] p-4">
                  <b className="mb-2 block text-xs uppercase tracking-wide">
                    Thành phần
                  </b>
                  <p className="mb-0 text-xs leading-6 text-[#68736c]">
                    {item.ingredients.join(" · ")}
                  </p>
                </div>
              )}

              {item.optionGroups.map((group) => (
                <fieldset
                  id={`option-${group._id}`}
                  key={group._id}
                  className="mb-6 scroll-mt-32 border-0 p-0"
                >
                  <legend className="mb-3 flex w-full items-center justify-between gap-3 text-sm font-extrabold">
                    <span>{group.name}</span>
                    <span className="text-[10px] font-bold text-[#68736c]">
                      {group.required ? "Bắt buộc" : "Tuỳ chọn"} · chọn tối đa{" "}
                      {group.maxSelect}
                    </span>
                  </legend>
                  <div className="grid gap-2">
                    {group.options.map((option) => {
                      const checked =
                        selections[group._id]?.includes(option._id) ?? false;
                      return (
                        <label
                          key={option._id}
                          className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5 transition ${checked ? "border-[#ff5a1f] bg-[#fff7f3]" : "border-[#e7ece8] bg-white hover:border-[#ffc4ad]"}`}
                        >
                          <span className="flex items-center gap-3 text-xs font-semibold">
                            <input
                              type={
                                group.maxSelect === 1 ? "radio" : "checkbox"
                              }
                              name={`option-${group._id}`}
                              checked={checked}
                              onChange={() => toggleOption(group, option._id)}
                              className="h-4 w-4 accent-[#ff5a1f]"
                            />
                            {option.name}
                          </span>
                          <b className="text-xs">
                            {option.priceDelta > 0
                              ? `+${formatMoney(option.priceDelta)}`
                              : "0đ"}
                          </b>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <label className="mb-6 block">
                <span className="mb-2 block text-xs font-extrabold">
                  Ghi chú cho quán
                </span>
                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value.slice(0, 200))
                  }
                  rows={3}
                  placeholder="Ví dụ: ít cay, không hành..."
                  className="w-full resize-none rounded-xl border border-[#e7ece8] bg-white p-3 text-xs outline-none focus:border-[#ff5a1f]"
                />
                <span className="mt-1 block text-right text-[10px] text-[#9ca59f]">
                  {note.length}/200
                </span>
              </label>

              {selectionError && (
                <p className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {selectionError}
                </p>
              )}
              {addedMessage && (
                <p className="mb-3 flex items-center gap-2 rounded-xl bg-[#e5f8eb] p-3 text-xs font-semibold text-[#167a3e]">
                  <Check className="h-4 w-4" />
                  {addedMessage}
                </p>
              )}

              <div className="flex gap-3 max-[480px]:flex-col">
                <div className="inline-flex h-12 shrink-0 items-center overflow-hidden rounded-xl border border-[#e7ece8] bg-white max-[480px]:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="grid h-12 w-11 place-items-center bg-white hover:bg-[#f7faf7]"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="grid h-12 min-w-10 place-items-center text-sm font-extrabold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.min(99, value + 1))
                    }
                    className="grid h-12 w-11 place-items-center bg-white hover:bg-[#f7faf7]"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!item.isAvailable}
                  onClick={() => handleAddToCart()}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-5 font-extrabold text-white transition hover:bg-[#e94e16] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {item.isAvailable
                    ? `Thêm vào giỏ · ${formatMoney(totalPrice)}`
                    : "Món đang tạm hết"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {item.relatedItems.length > 0 && (
        <section className="py-14">
          <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] max-[760px]:w-[calc(100%-1.5rem)]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2eae62]">
                  Ăn kèm thật hợp
                </span>
                <h2 className="mb-0 text-3xl font-extrabold tracking-[-.03em]">
                  Có thể bạn cũng thích
                </h2>
              </div>
              <Link
                to={`/restaurants/${item.restaurant.slug}`}
                className="text-xs font-bold text-[#ff5a1f]"
              >
                Xem thực đơn →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              {item.relatedItems.map((related) => (
                <Link
                  key={related._id}
                  to={`/restaurants/${item.restaurant.slug}/menu-items/${related.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[#e7ece8] bg-white transition hover:border-[#ffc4ad]"
                >
                  <div className="relative h-40 overflow-hidden bg-[#eef8f1]">
                    <img
                      src={`${SERVER_STATIC_ASSET_BASE_URL}${related.imageUrls?.[0] || "/assets/noodles.jpg"}`}
                      alt={related.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {!related.isAvailable && (
                      <span className="absolute inset-0 grid place-items-center bg-slate-900/50 text-xs font-extrabold text-white">
                        Tạm hết món
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 truncate text-sm font-bold group-hover:text-[#ff5a1f]">
                      {related.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <b className="text-[#ff5a1f]">
                        {formatMoney(related.effectivePrice)}
                      </b>
                      {related.salePrice !== null && (
                        <span className="text-[10px] text-[#9ca59f] line-through">
                          {formatMoney(related.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        itemName={item.name}
      />
      <RestaurantChangeModal
        isOpen={Boolean(pendingItemPayload)}
        // Extract restaurant name from conflict message
        currentRestaurantName={
          /"(.*?)"/.exec(conflictError)?.[1] || "quán khác"
        }
        nextRestaurantName={item.restaurant.name}
        onCancel={() => {
          setPendingItemPayload(null);
          setConflictError("");
        }}
        onConfirm={async () => {
          await handleAddToCart(true);
          setPendingItemPayload(null);
          setConflictError("");
        }}
      />
    </main>
  );
};
