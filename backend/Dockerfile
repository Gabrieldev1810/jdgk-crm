# CACHEBUST: 2026-01-05 v3 Revert to Standard
FROM node:18-alpine

# Install essential system dependencies for Prisma
# Only install what's absolutely necessary for production
RUN apk update && apk add --no-cache \
  curl \
  openssl \
  dumb-init \
  && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Generate Prisma client and ensure engines are available
RUN npm run db:generate

# Build the application
RUN npm run build

# Remove dev dependencies to reduce final image size
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check with extended startup time for database connections
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:3000/health || curl -f http://localhost:3000/ || exit 1

# Start the application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]