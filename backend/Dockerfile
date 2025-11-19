# Use Node.js 20 (Debian-based) for better compatibility
FROM node:20-slim AS builder

# Install system dependencies for Prisma and native modules
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Generate Prisma Client (before copying source)
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-slim

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

# Copy package files
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev --prefer-offline --no-audit && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Run migrations and start with explicit error handling
CMD sh -c "echo 'Starting application...' && \
    echo 'Running Prisma migrations...' && \
    npx prisma migrate deploy && \
    echo 'Migrations complete. Starting server...' && \
    node dist/src/main 2>&1 || (echo 'Application failed to start!' && exit 1)"
