# Immo2Kin — image web (Laravel API + SPA React, même origine)
FROM node:20-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Même origine : requêtes relatives /api
ENV VITE_API_URL=
RUN npm run build

FROM composer:2 AS vendor

WORKDIR /app/backend
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

FROM php:8.4-cli-alpine AS runtime

RUN apk add --no-cache \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    && docker-php-ext-install -j"$(nproc)" \
    pdo_mysql \
    mbstring \
    zip \
    bcmath \
    intl \
    opcache

WORKDIR /app/backend

COPY backend/ ./
COPY --from=vendor /app/backend/vendor ./vendor
COPY --from=frontend /app/frontend/dist ./public/spa-build

# Intègre le build Vite dans public/ (index.html + assets), conserve index.php Laravel
RUN cp -r public/spa-build/. public/ && rm -rf public/spa-build

COPY docker/start-web.sh /app/docker/start-web.sh
RUN chmod +x /app/docker/start-web.sh

RUN php artisan package:discover --ansi || true

ENV APP_ENV=production
ENV LOG_CHANNEL=stderr

EXPOSE 8000

CMD ["/app/docker/start-web.sh"]
