# MămMăm Food Ordering

Monorepo gồm customer web, dashboard Owner/Admin và API server.

## Yêu cầu

- Node.js 20.19 trở lên (hoặc 22.12 trở lên)
- npm 10 trở lên
- MongoDB đang chạy local hoặc một MongoDB connection string

## Chạy local

```bash
npm install
npm run dev
```

- Customer web: http://localhost:5173
- Owner/Admin dashboard: http://localhost:5174
- Backend: http://localhost:3000
- Health check: http://localhost:3000/api/health

Tài liệu dashboard và tài khoản development nằm tại [`client-dashboard/README.md`](client-dashboard/README.md). API contract nằm tại [`server/docs/dashboard-api.md`](server/docs/dashboard-api.md) và [`server/docs/recommendation-api.md`](server/docs/recommendation-api.md).

## Kiểm tra trước khi bàn giao

```bash
npm run typecheck
npm run build
npm run lint --workspace client-dashboard
npm run test --workspace client-dashboard
```

## Deploy VPS bằng Docker Hub

Pipeline trong [`.github/workflows/ci-dockerhub.yml`](.github/workflows/ci-dockerhub.yml) chạy kiểm tra trên pull request. Khi push/merge vào `main`, pipeline build và đẩy ba image vào cùng một Docker Hub repository:

```text
<username>/fsa-food-ordering:client-<commit-sha>
<username>/fsa-food-ordering:dashboard-<commit-sha>
<username>/fsa-food-ordering:server-<commit-sha>
```

Mỗi image cũng có tag `<component>-latest`.

### 1. Cấu hình GitHub và Docker Hub

Tạo một repository tên `fsa-food-ordering` trên Docker Hub. Trong GitHub repository, thêm:

- Variable `DOCKERHUB_USERNAME`: username Docker Hub.
- Variable `DOCKERHUB_REPOSITORY`: không bắt buộc, mặc định `fsa-food-ordering`.
- Secret `DOCKERHUB_TOKEN`: access token Docker Hub có quyền Read & Write.

Workflow mặc định build image `linux/amd64`.

### 2. Chuẩn bị VPS

Trỏ hai DNS record về VPS:

- Customer: ví dụ `food.example.com`.
- Dashboard: ví dụ `admin.food.example.com`.

Trên VPS, đặt repository hoặc tối thiểu các file `compose.yaml` và thư mục `deploy/` trong cùng một thư mục. Sau đó tạo cấu hình thật từ các file mẫu:

```bash
cp deploy/deploy.env.example deploy/deploy.env
cp deploy/server.env.example deploy/server.env
```

Điền domain, Docker Hub username và external `MONGODB_URI`. Không commit hai file này. Nếu Docker Hub repository là private, chạy `docker login` trên VPS bằng read-only token.

### 3. Pull và chạy

```bash
docker compose --env-file deploy/deploy.env pull
docker compose --env-file deploy/deploy.env up -d
docker compose --env-file deploy/deploy.env ps
```

Caddy tự cấp HTTPS khi DNS đã trỏ đúng và cổng `80`, `443` được mở. API và Socket.IO được proxy trên cùng domain với frontend.

Để deploy chính xác một phiên bản hoặc rollback, đổi `RELEASE_TAG=latest` trong `deploy/deploy.env` thành commit SHA đã được workflow publish, sau đó chạy lại `pull` và `up -d`.
