# Production image: build static assets, serve with nginx (no dev webpack on startup).
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG REACT_APP_API_BASE_URL=http://localhost:8001/api
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ARG REACT_APP_ENABLE_DEV_ROLE_OVERRIDE=false
ENV REACT_APP_ENABLE_DEV_ROLE_OVERRIDE=$REACT_APP_ENABLE_DEV_ROLE_OVERRIDE
# CRA treats ESLint warnings as errors when CI=true; image build should not fail on existing warnings.
ENV CI=false
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
