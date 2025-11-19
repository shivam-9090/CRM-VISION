# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

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
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy package files
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev --prefer-offline --no-audit && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
