# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY client-dashboard/package.json ./client-dashboard/package.json
COPY server/package.json ./server/package.json

RUN npm ci --workspace client-dashboard --include-workspace-root=false

COPY client-dashboard ./client-dashboard

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build --workspace client-dashboard

FROM nginx:1.29-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client-dashboard/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1
