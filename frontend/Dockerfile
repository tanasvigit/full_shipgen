# Production React console (Shipgen).
# Build context MUST be the repo root — see docker-compose.yml `frontend.build`.
FROM node:20-alpine AS builder

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY yms/frontend_1/ /build/yms/frontend_1/
COPY ["Parking management/frontend/", "/build/Parking management/frontend/"]

ARG VITE_API_NAMESPACE=int/v1
ARG VITE_API_TIMEOUT_MS=20000
ARG VITE_INSTALLER_API_TIMEOUT_MS=600000
ARG VITE_SOCKETCLUSTER_PROXY=true
ARG VITE_MAP_TILE_URL=http://localhost:8080/styles/basic/{z}/{x}/{y}.png
ARG VITE_YMS_API_BASE_URL=/api/yms
ARG VITE_PMS_API_BASE_URL=/api/pms
ARG VITE_YARD_BASE_PATH=/yard
ARG VITE_PMS_BASE_PATH=/parking

ENV VITE_API_NAMESPACE=$VITE_API_NAMESPACE
ENV VITE_API_TIMEOUT_MS=$VITE_API_TIMEOUT_MS
ENV VITE_INSTALLER_API_TIMEOUT_MS=$VITE_INSTALLER_API_TIMEOUT_MS
ENV VITE_SOCKETCLUSTER_PROXY=$VITE_SOCKETCLUSTER_PROXY
ENV VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL
ENV VITE_MAP_TILE_URL_DARK=$VITE_MAP_TILE_URL
ENV VITE_YMS_API_BASE_URL=$VITE_YMS_API_BASE_URL
ENV VITE_PMS_API_BASE_URL=$VITE_PMS_API_BASE_URL
ENV VITE_YARD_BASE_PATH=$VITE_YARD_BASE_PATH
ENV VITE_PMS_BASE_PATH=$VITE_PMS_BASE_PATH

# Leave VITE_API_HOST unset — runtime uses window.location.origin; nginx proxies API paths.
RUN npm run build

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
