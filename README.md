# Food Ordering


## Yêu cầu

- Node.js 20.19 trở lên (hoặc 22.12 trở lên)
- npm 10 trở lên
- MongoDB đang chạy local hoặc một MongoDB connection string

## Chạy local

```bash
./run.sh
```

Script sẽ tự cài dependencies và tạo `server/.env` nếu chưa có.

Mặc định server kết nối tới database `food_ordering` tại
`mongodb://127.0.0.1:27017`. Có thể thay đổi bằng `MONGODB_URI` và
`MONGODB_DB_NAME` trong `server/.env`.

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health check: http://localhost:3000/api/health
