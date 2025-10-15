@echo off
echo 🚀 Starting CRM Development Environment...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo ✅ Dependencies installed successfully!

echo 🗄️ Database setup...
echo Make sure PostgreSQL is running on localhost:5432
echo Database: crm_db, User: postgres, Password: password

echo 🔄 Setting up Prisma...
cd backend
call npx prisma generate
call npx prisma db push
cd ..

echo 🎉 Setup complete! Ready to start development servers.
echo.
echo To start the development servers:
echo Backend: cd backend ^&^& npm run start:dev
echo Frontend: cd frontend ^&^& npm run dev

pause