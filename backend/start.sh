#!/bin/bash
set -e

echo "==================================="
echo "RAILWAY DEPLOYMENT - STARTING APP"
echo "==================================="
echo ""
echo "Environment Variables:"
echo "  PORT: $PORT"
echo "  NODE_ENV: $NODE_ENV"
echo "  DATABASE_URL: ${DATABASE_URL:0:40}..."
echo "  JWT_SECRET: ${JWT_SECRET:0:15}..."
echo "  FRONTEND_URL: $FRONTEND_URL"
echo ""

echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "✓ Migrations complete"
echo ""

echo "Starting NestJS application..."
exec node dist/src/main
