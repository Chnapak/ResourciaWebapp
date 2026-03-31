FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BUILD_CONFIGURATION=development
RUN npm run build -- --configuration ${BUILD_CONFIGURATION}

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY docker-entrypoint.d/40-import-dev-cert.sh /docker-entrypoint.d/40-import-dev-cert.sh
RUN chmod +x /docker-entrypoint.d/40-import-dev-cert.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/resourcia-frontend/browser /usr/share/nginx/html
