# Multi-stage Docker build for SoulFriend V3.0
# Stage 1: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build backend
RUN npm run build

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./

# Build frontend
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S soulfriend -u 1001

# Set working directory
WORKDIR /app

# Copy backend production files
COPY --from=backend-builder --chown=soulfriend:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=soulfriend:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=soulfriend:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder --chown=soulfriend:nodejs /app/frontend/build ./frontend/build

# Copy environment files
COPY --chown=soulfriend:nodejs .env* ./

# Create logs directory
RUN mkdir -p /app/logs && chown soulfriend:nodejs /app/logs

# Switch to non-root user
USER soulfriend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]
