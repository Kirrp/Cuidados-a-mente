FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app.json tsconfig.json metro.config.js ./
COPY src ./src
COPY assets ./assets
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export --platform web --output-dir /web
FROM caddy:2
COPY --from=build /web /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
