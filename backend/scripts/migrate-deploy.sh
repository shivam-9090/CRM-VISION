#!/bin/bash
set -e

echo "🔄 Starting database migration..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 5

# Run migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Database migration completed successfully!"
