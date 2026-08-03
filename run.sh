#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Lỗi: Chưa cài Node.js." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Lỗi: Không tìm thấy npm." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Đang cài đặt dependencies..."
  npm install
fi

if [[ ! -f server/.env ]]; then
  cp server/.env.example server/.env
  echo "Đã tạo server/.env từ server/.env.example."
fi

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"

exec npm run dev
