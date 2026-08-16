# ---- Stage 1: build the frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 5000

# Graceful shutdown on SIGTERM/SIGINT is handled in server.js
CMD ["node", "server.js"]
