# Production React console (shipgen-fleet)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_HOST=http://localhost:8000
ARG VITE_API_NAMESPACE=int/v1
ARG VITE_SOCKETCLUSTER_PROXY=true
ARG VITE_MAP_TILE_URL=http://localhost:8080/styles/basic/{z}/{x}/{y}.png
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_API_NAMESPACE=$VITE_API_NAMESPACE
ENV VITE_SOCKETCLUSTER_PROXY=$VITE_SOCKETCLUSTER_PROXY
ENV VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL
ENV VITE_MAP_TILE_URL_DARK=$VITE_MAP_TILE_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
