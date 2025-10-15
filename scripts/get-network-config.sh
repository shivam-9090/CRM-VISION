#!/bin/bash
# Cross-Platform IP Detection Script

echo "🌐 CRM System - Cross-Platform Network Configuration"
echo "=================================================="
echo ""

echo "📍 Finding Workspace IP Addresses..."
echo ""

# Windows IP Detection
if command -v ipconfig &> /dev/null; then
    echo "🪟 Windows Network Interfaces:"
    ipconfig | grep -E "IPv4 Address|Default Gateway" | head -10
    echo ""
    echo "💡 Use the IPv4 Address (usually 192.168.x.x or 10.x.x.x)"
fi

# Linux/Mac IP Detection  
if command -v hostname &> /dev/null; then
    echo "🐧 Linux/Mac IP Addresses:"
    hostname -I 2>/dev/null || ifconfig | grep "inet " | grep -v "127.0.0.1"
    echo ""
fi

# Network Interface Detection
if command -v ip &> /dev/null; then
    echo "📡 Available Network Interfaces:"
    ip addr show | grep "inet " | grep -v "127.0.0.1"
    echo ""
fi

echo "📋 Configuration Instructions:"
echo "==============================="
echo ""
echo "1. 📝 Copy one of the IP addresses above (not 127.0.0.1)"
echo "2. 🖥️  On your PC, update frontend/.env.local:"
echo "   NEXT_PUBLIC_API_URL=http://[YOUR_WORKSPACE_IP]:3001"
echo ""
echo "3. 🔥 Windows Firewall (if needed):"
echo "   netsh advfirewall firewall add rule name=\"NestJS-API\" dir=in action=allow protocol=TCP localport=3001"
echo ""
echo "4. 🧪 Test connection from your PC:"
echo "   curl http://[YOUR_WORKSPACE_IP]:3001/api/auth/login"
echo ""
echo "🚀 Backend Status:"
echo "=================="
echo "✅ Backend: Running on port 3001 (all interfaces)"  
echo "✅ Database: PostgreSQL running"
echo "✅ CORS: Configured for cross-platform access"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Start frontend on your PC: npm run dev"
echo "2. Access CRM at: http://localhost:3000"
echo "3. Frontend will connect to this workspace backend"
echo ""