#!/bin/bash
# Development setup script

echo "🚀 Starting CRM Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Dependencies installed successfully!"

echo "🗄️ Database setup..."
echo "Make sure PostgreSQL is running on localhost:5432"
echo "Database: crm_db, User: postgres, Password: password"

echo "🔄 Setting up Prisma..."
cd backend
npx prisma generate
npx prisma db push
cd ..

echo "🎉 Setup complete! Ready to start development servers."
echo ""
echo "To start the development servers:"
echo "Backend: cd backend && npm run start:dev"
echo "Frontend: cd frontend && npm run dev"