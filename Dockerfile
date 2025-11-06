# Multi-stage build for SoulFriend Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Build if needed (TypeScript compilation)
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose port (Railway will override with PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8080}/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]

