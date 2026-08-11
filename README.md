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
