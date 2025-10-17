@echo off
setlocal enabledelayedexpansion

echo ================================================================================================
echo                                   CRM-VISION Setup Script                                    
echo ================================================================================================
echo.

:: Colors for Windows (limited)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

:: Check if required tools are installed
echo %INFO% Checking requirements...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% npm is not installed. Please install npm
    pause
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% Docker is not installed. Please install Docker Desktop from https://docker.com/
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo %ERROR% Docker Compose is not installed. Please install Docker Compose
    pause
    exit /b 1
)

echo %SUCCESS% All requirements satisfied!
echo.

:: Setup environment files
echo %INFO% Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo %SUCCESS% Created backend\.env
) else (
    echo %WARNING% backend\.env already exists, skipping...
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.example" "frontend\.env.local" >nul
    echo %SUCCESS% Created frontend\.env.local
) else (
    echo %WARNING% frontend\.env.local already exists, skipping...
)

echo.

:: Install dependencies
echo %INFO% Installing dependencies...

echo %INFO% Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo %ERROR% Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo %SUCCESS% Backend dependencies installed!

echo %INFO% Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo %ERROR% Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo %SUCCESS% Frontend dependencies installed!

echo.

:: Setup database with Docker
echo %INFO% Setting up database...

:: Start only PostgreSQL first
docker-compose up -d postgres
if %errorlevel% neq 0 (
    echo %ERROR% Failed to start PostgreSQL container
    pause
    exit /b 1
)

:: Wait for database to be ready
echo %INFO% Waiting for database to be ready...
timeout /t 15 /nobreak >nul

:: Run database migrations
echo %INFO% Running database migrations...
cd backend
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo %WARNING% Migration may have failed, but continuing...
)

:: Seed database
echo %INFO% Seeding database with sample data...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo %WARNING% Database seeding may have failed, but continuing...
)
cd ..

echo %SUCCESS% Database setup completed!
echo.

:: Get local IP address
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%i"
    set "ip=!ip: =!"
    goto :ip_found
)
set "ip=YOUR_IP_ADDRESS"
:ip_found

:: Display completion message
echo ================================================================================================
echo                                   SETUP COMPLETED SUCCESSFULLY!                              
echo ================================================================================================
echo.
echo ^📋 Next Steps:
echo ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
echo.
echo ^🚀 Start Development Servers:
echo    Backend:  cd backend ^&^& npm run start:dev
echo    Frontend: cd frontend ^&^& npm run dev
echo.
echo ^🐳 Or use Docker (Recommended):
echo    docker-compose up -d
echo.
echo ^🌐 Access URLs:
echo    Frontend:    http://localhost:3000
echo    Backend API: http://localhost:3001/api
echo    Database:    postgresql://postgres:postgres@localhost:5432/crm_db
echo.
echo ^📱 For Cross-Device Access:
echo    Update frontend\.env.local:
echo    NEXT_PUBLIC_API_URL=http://%ip%:3001/api
echo.
echo    Then access from other devices:
echo    Frontend: http://%ip%:3000
echo    Backend:  http://%ip%:3001/api
echo.
echo ^🔐 Default Login Credentials:
echo    Email:    admin@company.com
echo    Password: admin123
echo.
echo ^📚 Documentation:
echo    View README.md for detailed setup and usage instructions
echo.
echo ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

pause