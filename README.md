# MămMăm Food Ordering

Monorepo cho hệ thống đặt món ăn trực tuyến, gồm giao diện khách hàng, dashboard vận hành và API backend.

## Tổng quan hệ thống

| Thành phần | Thư mục | Vai trò | URL local |
| --- | --- | --- | --- |
| Customer web | `client/` | Khách hàng tìm nhà hàng, chọn món, đặt hàng, thanh toán và theo dõi đơn | http://localhost:5173 |
| Owner/Admin dashboard | `client-dashboard/` | Chủ nhà hàng quản lý nhà hàng, thực đơn, đơn hàng; Admin quản trị và theo dõi hệ thống | http://localhost:5174 |
| API server | `server/` | Xác thực, nghiệp vụ đơn hàng, thanh toán, đánh giá, gợi ý và realtime Socket.IO | http://localhost:3000 |
| Database | MongoDB | Lưu trữ người dùng, nhà hàng, thực đơn, giỏ hàng, đơn hàng và dữ liệu nghiệp vụ | `mongodb://127.0.0.1:27017` |

Trong môi trường local, hai ứng dụng frontend gọi API qua Vite proxy tại `/api`. Khi triển khai production, Caddy định tuyến frontend và các request `/api`, `/socket.io` tới đúng service trong Docker Compose.

## Công nghệ chính

- React, TypeScript và Vite cho hai ứng dụng frontend.
- Express, TypeScript và Mongoose cho API server.
- MongoDB cho dữ liệu nghiệp vụ.
- TanStack Query, React Hook Form và Zod cho data fetching và validation.
- Socket.IO cho các cập nhật realtime.
- Docker, Docker Compose và Caddy cho triển khai VPS.

## Cấu trúc repository

```text
.
├── client/                 # Customer web
├── client-dashboard/       # Dashboard Owner/Admin
├── server/                 # Express API và Socket.IO
├── docker/                 # Dockerfile cho từng service
├── deploy/                 # Caddy và file cấu hình deploy mẫu
├── compose.yaml            # Chạy các image production cùng Caddy
├── package.json            # Workspace và script dùng chung
└── .github/workflows/      # CI, build và publish image lên Docker Hub
```

Tài liệu chi tiết theo module:

- [`client-dashboard/README.md`](client-dashboard/README.md): dashboard, RBAC và các lệnh kiểm tra riêng.
- [`server/docs/dashboard-api.md`](server/docs/dashboard-api.md): contract API cho dashboard.
- [`server/docs/recommendation-api.md`](server/docs/recommendation-api.md): API và dữ liệu cho tính năng gợi ý.

## Yêu cầu môi trường

- Node.js `20.19+` hoặc `22.12+`.
- npm `10+`.
- MongoDB đang chạy local hoặc một MongoDB connection string có thể truy cập.

Kiểm tra phiên bản:

```bash
node --version
npm --version
```

## Cài đặt và cấu hình local

### 1. Cài dependency

Từ thư mục gốc repository:

```bash
npm install
```

Repository dùng npm workspaces nên chỉ cần cài dependency một lần ở thư mục gốc.

### 2. Tạo file môi trường

Sao chép các file mẫu tương ứng:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp client-dashboard/.env.example client-dashboard/.env
```

Trên Windows PowerShell, có thể dùng:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
Copy-Item client-dashboard/.env.example client-dashboard/.env
```

Ít nhất cần kiểm tra các giá trị sau trong `server/.env`:

- `MONGODB_URI` và `MONGODB_DB_NAME`.
- `JWT_SECRET` và `JWT_REFRESH_SECRET`.
- `CLIENT_ORIGIN`/`CLIENT_ORIGINS` nếu frontend chạy khác origin mặc định.
- Cấu hình VNPAY và SMTP nếu muốn kiểm thử thanh toán hoặc email thật.

Mặc định server chạy tại port `3000`, customer web tại `5173` và dashboard tại `5174`. Không commit các file `.env` chứa secret.

## Chạy ứng dụng

### Chạy toàn bộ hệ thống

```bash
npm run dev
```

Lệnh này khởi động đồng thời customer web, dashboard và API server. Mở các địa chỉ sau để kiểm tra:

- Customer web: http://localhost:5173
- Owner/Admin dashboard: http://localhost:5174
- API health check: http://localhost:3000/api/health

### Chạy từng service

```bash
npm run dev:customer
npm run dev:dashboard
npm run dev:server
```

Có thể chạy các lệnh trên ở những terminal riêng khi cần theo dõi log của từng service.

### Vite proxy và API URL

Hai frontend mặc định dùng:

```text
VITE_API_BASE_URL=/api
```

Giá trị này cho phép frontend gọi API cùng origin trong local thông qua Vite proxy. Khi deploy frontend ở origin riêng, đặt `VITE_API_BASE_URL` thành URL đầy đủ theo hướng dẫn trong file `.env.example` tương ứng.

## Các lệnh thường dùng

| Mục đích | Lệnh |
| --- | --- |
| Build tất cả workspace | `npm run build` |
| Typecheck tất cả workspace có hỗ trợ | `npm run typecheck` |
| Build customer web | `npm run build --workspace client` |
| Build dashboard | `npm run build --workspace client-dashboard` |
| Typecheck API server | `npm run typecheck --workspace server` |
| Lint dashboard | `npm run lint --workspace client-dashboard` |
| Test dashboard | `npm run test --workspace client-dashboard` |
| Chạy API production sau khi build | `npm run start` |

Trước khi tạo pull request, nên chạy tối thiểu:

```bash
npm run typecheck
npm run build
npm run lint --workspace client-dashboard
npm run test --workspace client-dashboard
```

## Triển khai Docker/VPS

Workflow [`.github/workflows/ci-dockerhub.yml`](.github/workflows/ci-dockerhub.yml) sẽ build và publish ba image khi thay đổi được push lên nhánh đã cấu hình:

```text
<username>/fsa-food-ordering:client-<commit-sha>
<username>/fsa-food-ordering:dashboard-<commit-sha>
<username>/fsa-food-ordering:server-<commit-sha>
```

Để triển khai trên VPS:

1. Tạo Docker Hub repository và cấu hình `DOCKERHUB_USERNAME`, `DOCKERHUB_REPOSITORY` (tuỳ chọn) và secret `DOCKERHUB_TOKEN` trong GitHub.
2. Sao chép file mẫu:

   ```bash
   cp deploy/deploy.env.example deploy/deploy.env
   cp deploy/server.env.example deploy/server.env
   ```

3. Điền domain, Docker Hub username, `RELEASE_TAG` và `MONGODB_URI`; không commit các file cấu hình thật.
4. Trên VPS, chạy:

   ```bash
   docker compose --env-file deploy/deploy.env pull
   docker compose --env-file deploy/deploy.env up -d
   docker compose --env-file deploy/deploy.env ps
   ```

`compose.yaml` chạy ba image ứng dụng và Caddy. Caddy tự cấp HTTPS khi DNS trỏ đúng về VPS và cổng `80`, `443` được mở. Để rollback, đổi `RELEASE_TAG` sang commit SHA đã publish rồi chạy lại `pull` và `up -d`.

## Tài liệu tham khảo nhanh

- Cấu hình server: [`server/.env.example`](server/.env.example)
- Cấu hình customer web: [`client/.env.example`](client/.env.example)
- Cấu hình dashboard: [`client-dashboard/.env.example`](client-dashboard/.env.example)
- Cấu hình deploy: [`deploy/deploy.env.example`](deploy/deploy.env.example), [`deploy/server.env.example`](deploy/server.env.example)
- Docker Compose: [`compose.yaml`](compose.yaml)

## Quy ước đóng góp

1. Tạo branch cho thay đổi và giữ phạm vi commit rõ ràng.
2. Cập nhật tài liệu liên quan khi thay đổi script, biến môi trường hoặc API contract.
3. Chạy các lệnh kiểm tra ở trên trước khi mở pull request.
4. Không commit secret, file `.env` thật hoặc dữ liệu production.
