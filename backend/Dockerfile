FROM node:18-alpine

# Install system dependencies for Prisma and health checks
# OpenSSL libs are required for Prisma Client to work properly
RUN apk add --no-cache \
    wget \
    openssl \
    openssl-dev \
    libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]