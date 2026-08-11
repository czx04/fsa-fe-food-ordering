# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY client-dashboard/package.json ./client-dashboard/package.json
COPY server/package.json ./server/package.json

RUN npm ci --workspace server --include-workspace-root=false

COPY server ./server

RUN npm run build --workspace server

FROM node:22-bookworm-slim AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY client-dashboard/package.json ./client-dashboard/package.json
COPY server/package.json ./server/package.json

RUN npm ci --omit=dev --workspace server --include-workspace-root=false \
  && npm cache clean --force

FROM node:22-bookworm-slim AS runtime

WORKDIR /app/server

ENV NODE_ENV=production

COPY --from=production-dependencies --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/server/dist ./dist
COPY --chown=node:node server/package.json ./package.json

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
