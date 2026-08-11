import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Image, MapPin, Save, Store, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, Field, Input, Select, Textarea } from "../components/ui";
import { api } from "../lib/api";
import type { Cuisine, OpeningHours, Restaurant } from "../types";

const restaurantSchema = z.object({
  name: z.string().trim().min(3, "Tên nhà hàng cần ít nhất 3 ký tự."),
  description: z.string().trim().min(20, "Mô tả cần ít nhất 20 ký tự."),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ."),
  line1: z.string().trim().min(3, "Vui lòng nhập địa chỉ."),
  ward: z.string().trim().min(2, "Vui lòng nhập phường/xã."),
  district: z.string().trim().min(2, "Vui lòng nhập quận/huyện."),
  city: z.string().trim().min(2, "Vui lòng nhập tỉnh/thành phố."),
  priceRange: z.enum(["budget", "mid", "premium"]),
  logoUrl: z.union([z.literal(""), z.string().url("URL logo không hợp lệ.")]),
  coverUrl: z.union([z.literal(""), z.string().url("URL ảnh bìa không hợp lệ.")]),
  galleryUrls: z.string(),
  deliveryFee: z.number().min(0, "Phí giao hàng không được âm."),
  minMinutes: z.number().int().min(1, "Thời gian tối thiểu phải lớn hơn 0."),
  maxMinutes: z.number().int().min(1, "Thời gian tối đa phải lớn hơn 0."),
  maxDistanceKm: z.number().min(0, "Bán kính không được âm."),
  cuisineCategoryIds: z.array(z.string()).min(1, "Chọn ít nhất một loại ẩm thực."),
}).refine((values) => values.maxMinutes >= values.minMinutes, { path: ["maxMinutes"], message: "Thời gian tối đa phải lớn hơn tối thiểu." });

export type RestaurantFormValues = z.infer<typeof restaurantSchema>;

const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

const defaultHours = (): OpeningHours[] => Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isClosed: false,
  slots: [{ open: "08:00", close: "22:00" }],
}));

const valuesFromRestaurant = (restaurant?: Restaurant): RestaurantFormValues => ({
  name: restaurant?.name ?? "",
  description: restaurant?.description ?? "",
  phone: restaurant?.phone ?? "",
  line1: restaurant?.address.line1 ?? "",
  ward: restaurant?.address.ward ?? "",
  district: restaurant?.address.district ?? "",
  city: restaurant?.address.city ?? "",
  priceRange: restaurant?.priceRange ?? "budget",
  logoUrl: restaurant?.logoUrl ?? "",
  coverUrl: restaurant?.coverUrl ?? "",
  galleryUrls: restaurant?.galleryUrls?.join("\n") ?? "",
  deliveryFee: restaurant?.delivery.fee ?? 15_000,
  minMinutes: restaurant?.delivery.minMinutes ?? 20,
  maxMinutes: restaurant?.delivery.maxMinutes ?? 40,
  maxDistanceKm: restaurant?.delivery.maxDistanceKm ?? 8,
  cuisineCategoryIds: restaurant?.cuisineCategoryIds?.map((item) => item._id) ?? [],
});

export function RestaurantForm({
  restaurant,
  submitLabel,
  submitting,
  onSubmit,
}: {
  restaurant?: Restaurant;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [openingHours, setOpeningHours] = useState<OpeningHours[]>(restaurant?.openingHours?.length ? restaurant.openingHours : defaultHours());
  const [hoursError, setHoursError] = useState("");
  const cuisinesQuery = useQuery({
    queryKey: ["public", "cuisines"],
    queryFn: () => api.get<Cuisine[]>("/public/categories").then((response) => response.data),
    staleTime: 5 * 60_000,
  });
  const defaults = useMemo(() => valuesFromRestaurant(restaurant), [restaurant]);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
    setOpeningHours(restaurant?.openingHours?.length ? restaurant.openingHours : defaultHours());
  }, [defaults, reset, restaurant?.openingHours]);

  const selectedCuisines = watch("cuisineCategoryIds") ?? [];
  const toggleCuisine = (id: string) => {
    setValue("cuisineCategoryIds", selectedCuisines.includes(id) ? selectedCuisines.filter((value) => value !== id) : [...selectedCuisines, id], { shouldValidate: true });
  };

  const updateHours = (dayOfWeek: number, patch: Partial<OpeningHours>) => { setHoursError(""); setOpeningHours((current) => current.map((entry) => entry.dayOfWeek === dayOfWeek ? { ...entry, ...patch } : entry)); };
  const updateSlot = (dayOfWeek: number, field: "open" | "close", value: string) => { setHoursError(""); setOpeningHours((current) => current.map((entry) => entry.dayOfWeek === dayOfWeek ? { ...entry, slots: [{ open: entry.slots[0]?.open ?? "08:00", close: entry.slots[0]?.close ?? "22:00", [field]: value }] } : entry)); };

  const submit = handleSubmit(async (values) => {
    const invalidSlot = openingHours.find((entry) => !entry.isClosed && entry.slots.some((slot) => slot.open >= slot.close));
    if (invalidSlot) {
      setHoursError(`Giờ đóng cửa của ${dayNames[invalidSlot.dayOfWeek]} phải sau giờ mở cửa.`);
      return;
    }
    setHoursError("");
    await onSubmit({
      name: values.name,
      description: values.description,
      phone: values.phone,
      address: { line1: values.line1, ward: values.ward, district: values.district, city: values.city },
      line1: values.line1,
      ward: values.ward,
      district: values.district,
      city: values.city,
      priceRange: values.priceRange,
      logoUrl: values.logoUrl || null,
      coverUrl: values.coverUrl || null,
      galleryUrls: values.galleryUrls.split(/[\n,]/).map((value) => value.trim()).filter(Boolean),
      cuisineCategoryIds: values.cuisineCategoryIds,
      openingHours,
      delivery: { fee: values.deliveryFee, minMinutes: values.minMinutes, maxMinutes: values.maxMinutes, maxDistanceKm: values.maxDistanceKm },
    });
  });

  return (
    <form onSubmit={(event) => void submit(event)} className="settings-stack">
      <Card>
        <div className="card-heading"><div><span className="section-icon"><Store size={18} /></span><h2>Thông tin chung</h2><p>Thông tin khách hàng nhìn thấy trên trang nhà hàng.</p></div></div>
        <div className="form-grid">
          <Field label="Tên nhà hàng" required error={errors.name?.message}><Input {...register("name")} /></Field>
          <Field label="Số điện thoại" required error={errors.phone?.message}><Input {...register("phone")} /></Field>
          <Field label="Phân khúc giá" required error={errors.priceRange?.message}><Select {...register("priceRange")}><option value="budget">Bình dân</option><option value="mid">Tầm trung</option><option value="premium">Cao cấp</option></Select></Field>
          <Field label="Mô tả" required error={errors.description?.message}><Textarea rows={4} {...register("description")} /></Field>
          <div className="form-span">
            <Field label="Loại ẩm thực" required error={errors.cuisineCategoryIds?.message}>
              <div className="choice-grid">
                {cuisinesQuery.data?.map((cuisine) => (
                  <label key={cuisine._id} className={`choice-chip ${selectedCuisines.includes(cuisine._id) ? "selected" : ""}`}>
                    <input type="checkbox" checked={selectedCuisines.includes(cuisine._id)} onChange={() => toggleCuisine(cuisine._id)} />{cuisine.name}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-heading"><div><span className="section-icon"><MapPin size={18} /></span><h2>Địa chỉ</h2><p>Địa chỉ dùng để hiển thị và tính khu vực giao hàng.</p></div></div>
        <div className="form-grid">
          <Field label="Số nhà, tên đường" required error={errors.line1?.message}><Input {...register("line1")} /></Field>
          <Field label="Phường/Xã" required error={errors.ward?.message}><Input {...register("ward")} /></Field>
          <Field label="Quận/Huyện" required error={errors.district?.message}><Input {...register("district")} /></Field>
          <Field label="Tỉnh/Thành phố" required error={errors.city?.message}><Input {...register("city")} /></Field>
        </div>
      </Card>

      <Card>
        <div className="card-heading"><div><span className="section-icon"><Clock3 size={18} /></span><h2>Giờ mở cửa</h2><p>MVP hỗ trợ một khung giờ mỗi ngày.</p></div></div>
        {hoursError && <div className="form-alert" role="alert">{hoursError}</div>}
        <div className="hours-list">
          {openingHours.map((entry) => (
            <div className="hours-row" key={entry.dayOfWeek}>
              <strong>{dayNames[entry.dayOfWeek]}</strong>
              <label className="checkbox-label"><input type="checkbox" checked={entry.isClosed} onChange={(event) => updateHours(entry.dayOfWeek, { isClosed: event.target.checked, slots: event.target.checked ? [] : [{ open: "08:00", close: "22:00" }] })} /> Nghỉ</label>
              {!entry.isClosed && <><Input type="time" value={entry.slots[0]?.open ?? "08:00"} onChange={(event) => updateSlot(entry.dayOfWeek, "open", event.target.value)} /><span>đến</span><Input type="time" value={entry.slots[0]?.close ?? "22:00"} onChange={(event) => updateSlot(entry.dayOfWeek, "close", event.target.value)} /></>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-heading"><div><span className="section-icon"><Truck size={18} /></span><h2>Giao hàng</h2><p>Cấu hình phí và thời gian giao dự kiến.</p></div></div>
        <div className="form-grid form-grid-four">
          <Field label="Phí giao hàng (₫)" error={errors.deliveryFee?.message}><Input type="number" min={0} {...register("deliveryFee", { valueAsNumber: true })} /></Field>
          <Field label="Tối thiểu (phút)" error={errors.minMinutes?.message}><Input type="number" min={1} {...register("minMinutes", { valueAsNumber: true })} /></Field>
          <Field label="Tối đa (phút)" error={errors.maxMinutes?.message}><Input type="number" min={1} {...register("maxMinutes", { valueAsNumber: true })} /></Field>
          <Field label="Bán kính (km)" error={errors.maxDistanceKm?.message}><Input type="number" min={0} step="0.5" {...register("maxDistanceKm", { valueAsNumber: true })} /></Field>
        </div>
      </Card>

      <Card>
        <div className="card-heading"><div><span className="section-icon"><Image size={18} /></span><h2>Hình ảnh</h2><p>Đang dùng URL ảnh; có thể nâng cấp signed upload sau.</p></div></div>
        <div className="form-grid">
          <Field label="URL logo" error={errors.logoUrl?.message}><Input placeholder="https://..." {...register("logoUrl")} /></Field>
          <Field label="URL ảnh bìa" error={errors.coverUrl?.message}><Input placeholder="https://..." {...register("coverUrl")} /></Field>
          <Field label="Thư viện ảnh" hint="Mỗi URL một dòng hoặc phân tách bằng dấu phẩy."><Textarea rows={4} {...register("galleryUrls")} /></Field>
        </div>
      </Card>
      <div className="sticky-form-actions"><Button type="submit" loading={submitting}><Save size={17} /> {submitLabel}</Button></div>
    </form>
  );
}
