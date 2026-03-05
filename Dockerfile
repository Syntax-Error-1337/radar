# Multi-stage build for INTELMAP

# Stage 1: Build everything (using monorepo structure)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (like DuckDB)
RUN apk add --no-cache python3 make g++

# Copy root package files and workspace configs
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (respects workspace structure)
RUN npm ci

# Copy source code for both client and server
COPY client/ ./client/
COPY server/ ./server/

# Build client
RUN npm run build:client

# Build server
RUN npm run build:server

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files for structure
COPY package*.json ./
COPY server/package*.json ./server/

# Copy node_modules from builder (includes compiled DuckDB)
# This avoids rebuilding native modules in production
COPY --from=builder /app/node_modules ./node_modules

# Copy built server from builder
COPY --from=builder /app/server/dist ./dist

# Copy built client from builder (to be served by Express)
COPY --from=builder /app/client/dist ./public

# Copy server source files that might be needed at runtime
COPY --from=builder /app/server/src/news_feeds.json ./
COPY --from=builder /app/server/src/Data/*.parquet ./Data/ 2>/dev/null || true

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set NODE_ENV
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
