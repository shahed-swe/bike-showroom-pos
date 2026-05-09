# Build stage — produce production dist
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage — small node image with `serve` for static SPA
FROM node:20-alpine AS serve

WORKDIR /app

# `serve` is a tiny static file server that handles SPA fallback (--single).
RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

EXPOSE 5173

# -s: SPA mode (rewrite all routes to index.html for React Router)
# -l: listen port
CMD ["serve", "-s", "dist", "-l", "5173"]
