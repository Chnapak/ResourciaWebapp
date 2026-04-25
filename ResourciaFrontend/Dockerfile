FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BUILD_CONFIGURATION=development
RUN npm run build -- --configuration ${BUILD_CONFIGURATION}

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/resourcia-frontend/browser /usr/share/nginx/html
