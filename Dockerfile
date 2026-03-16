# Multi-stage build for SoulFriend Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN cd backend && npm ci

# Copy source directories needed for TypeScript compilation
COPY gamefi/ ./gamefi/
COPY integration/ ./integration/
COPY backend/ ./backend/

# Build TypeScript (rootDir=".." so tsc needs access to gamefi/ and integration/)
RUN cd backend && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install Python runtime for lexical canonical worker
RUN apk add --no-cache python3

# Copy package files
COPY backend/package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder (includes dist/backend/src, dist/gamefi, dist/integration)
COPY --from=builder /app/backend/dist ./dist

# Copy lexical engine runtime used by English Lab bridge
COPY lexical_engine/ ./lexical_engine/

# Stable runtime path for Python bridge
ENV LEXICAL_ENGINE_DIR=/app/lexical_engine
ENV PYTHON_BRIDGE_BIN=python3

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
USER nodeuser

# Expose port (Railway will override with PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8080}/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]

