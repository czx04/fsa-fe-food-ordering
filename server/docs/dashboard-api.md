# Dashboard API contract

Base URL: `/api`. Mọi endpoint Owner/Admin yêu cầu `Authorization: Bearer <access-token>` và kiểm tra role phía server.

## Response chung

List:

```json
{ "data": [], "meta": { "page": 1, "limit": 20, "totalItems": 0, "totalPages": 0 } }
```

Validation error:

```json
{
  "message": "Thông báo lỗi đầu tiên",
  "code": "VALIDATION_ERROR",
  "fieldErrors": { "field": "Thông báo theo field" },
  "errors": [{ "field": "field", "message": "Thông báo theo field" }]
}
```

## Auth và tài khoản

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/verify-email`
- `PATCH /users/me`

## Owner

- `GET|POST /owner/restaurants`
- `GET|PATCH /owner/restaurants/:restaurantId`
- `PATCH /owner/restaurants/:restaurantId/operation-status`
- `GET /owner/restaurants/:restaurantId/dashboard`
- `GET /owner/restaurants/:restaurantId/orders`
- `GET /owner/restaurants/:restaurantId/orders/:orderId`
- `PATCH /owner/restaurants/:restaurantId/orders/:orderId/status`
- CRUD `/owner/restaurants/:restaurantId/menu-categories`
- CRUD `/owner/restaurants/:restaurantId/menu-items`
- `GET /owner/restaurants/:restaurantId/reviews`
- `PUT|DELETE /owner/restaurants/:restaurantId/reviews/:reviewId/reply`

Mọi resource con đều được ràng buộc bằng `restaurantId + ownerId`. Truy cập chéo owner trả `404` để không làm lộ resource.

State machine đơn hàng:

```text
pending -> confirmed | cancelled
confirmed -> preparing | cancelled
preparing -> delivering
delivering -> delivered
```

Transition dùng compare-and-set theo trạng thái hiện tại; mutation stale trả `409`.

## Admin

- `GET /admin/dashboard`
- `GET /admin/restaurants` và moderation theo `:restaurantId`
- `GET /admin/users` và lock/unlock/reset theo `:userId`
- `GET /admin/orders` và `GET /admin/orders/:orderId` (read-only)
- CRUD `/admin/cuisines`
- CRUD/status `/admin/coupons`
- `GET /admin/reviews` và moderation visibility
- `GET /admin/analytics`
- `GET /admin/audit-logs`

Approve/reject/suspend restaurant, lock user, coupon mutation và review moderation đều ghi `AuditLog`.
