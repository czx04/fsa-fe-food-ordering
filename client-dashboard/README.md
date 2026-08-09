# MămMăm Console

Dashboard vận hành dùng chung cho Chủ nhà hàng (`restaurant_owner`) và Quản trị viên (`admin`). Ứng dụng dùng React 19, TypeScript, Vite, TanStack Query, React Hook Form và Zod; toàn bộ dữ liệu nghiệp vụ lấy từ API thật trong workspace `server`.

## Chạy local

Từ thư mục gốc repository:

```bash
npm install
npm run dev:server
npm run dev:dashboard
```

- Dashboard: http://localhost:5174
- API: http://localhost:3000/api
- Customer web: http://localhost:5173

Vite proxy mặc định chuyển `/api` về port `3000`. Khi deploy riêng origin, sao chép `.env.example` thành `.env` và đặt `VITE_API_BASE_URL`.

## Tài khoản seed

Mật khẩu dùng chung: `password123`.

| Vai trò | Email |
|---|---|
| Admin | `admin@foodordering.com` |
| Owner nhiều nhà hàng | `owner1@foodordering.com` |
| Owner có đơn/review mẫu | `owner2@foodordering.com` |

Chạy `npm run seed` để tạo lại dữ liệu mẫu. Lệnh seed xóa dữ liệu nghiệp vụ hiện có trong database đã cấu hình, vì vậy chỉ dùng trên môi trường development/test.

## Lệnh kiểm tra

```bash
npm run lint --workspace client-dashboard
npm run test --workspace client-dashboard
npm run build --workspace client-dashboard
npm run typecheck --workspace server
npm run smoke:dashboard
```

## Kiến trúc chính

- `src/app`: session, provider, RBAC route guard.
- `src/lib/api.ts`: Axios client, access/refresh token rotation và xử lý 401 tập trung.
- `src/layouts`: auth shell và dashboard shell responsive.
- `src/pages/owner.tsx`: restaurant, overview, order, menu, review, settings.
- `src/pages/admin.tsx`: moderation, user, order, cuisine, coupon, review, analytics, audit.
- `src/components`: primitive dùng chung và status mapping có label rõ ràng.

Token hiện được lưu ở `localStorage` khi bật "Ghi nhớ đăng nhập", hoặc `sessionStorage` khi tắt. Production nên chuyển refresh token sang cookie `HttpOnly + Secure + SameSite` khi backend hỗ trợ cookie session.
