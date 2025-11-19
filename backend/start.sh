#!/bin/bash
set -e

echo "==================================="
echo "RAILWAY DEPLOYMENT - STARTING APP"
echo "==================================="
echo ""
echo "Environment Variables:"
echo "  PORT: ${PORT:-NOT_SET}"
echo "  NODE_ENV: $NODE_ENV"
echo "  DATABASE_URL: ${DATABASE_URL:0:40}..."
echo "  JWT_SECRET: ${JWT_SECRET:0:15}..."
echo "  FRONTEND_URL: $FRONTEND_URL"
echo ""

# Railway should provide PORT automatically
# If not set, we'll use 3001 but this is NOT ideal
if [ -z "$PORT" ]; then
  echo "⚠️  WARNING: PORT not set by Railway! Using 3001 as fallback"
  export PORT=3001
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"
echo ""

echo "Starting NestJS application on port $PORT..."
exec node dist/src/main
