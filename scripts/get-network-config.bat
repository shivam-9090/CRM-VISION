@echo off
REM Cross-Platform IP Detection Script for Windows

echo 🌐 CRM System - Cross-Platform Network Configuration
echo ==================================================
echo.

echo 📍 Finding Workspace IP Addresses...
echo.

echo 🪟 Windows Network Configuration:
ipconfig | findstr /C:"IPv4 Address" /C:"Default Gateway"
echo.

echo 💡 Network Interfaces:
ipconfig | findstr /C:"Ethernet adapter" /C:"Wireless LAN adapter"
echo.

echo 📋 Configuration Instructions:
echo ===============================
echo.
echo 1. 📝 Copy the IPv4 Address above (usually 192.168.x.x or 10.x.x.x)
echo 2. 🖥️  On your PC, create frontend/.env.local:
echo    NEXT_PUBLIC_API_URL=http://[YOUR_WORKSPACE_IP]:3001
echo    NEXT_PUBLIC_API_BASE_URL=http://[YOUR_WORKSPACE_IP]:3001/api
echo.
echo 3. 🔥 Open Windows Firewall (if needed):
powershell -Command "New-NetFirewallRule -DisplayName 'NestJS-API' -Direction Inbound -Port 3001 -Protocol TCP -Action Allow" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Firewall rule added successfully
) else (
    echo    ⚠️  Run as Administrator to add firewall rule automatically
    echo    Or manually allow port 3001 in Windows Defender Firewall
)
echo.

echo 4. 🧪 Test connection from your PC:
echo    curl http://[YOUR_WORKSPACE_IP]:3001/api/auth/login
echo.

echo 🚀 Backend Status:
echo ==================
echo ✅ Backend: Running on port 3001 (all interfaces)
echo ✅ Database: PostgreSQL running  
echo ✅ CORS: Configured for cross-platform access
echo.

echo 🎯 Next Steps:
echo ==============
echo 1. Start frontend on your PC: npm run dev
echo 2. Access CRM at: http://localhost:3000
echo 3. Frontend will connect to this workspace backend
echo.

pause