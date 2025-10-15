# 🌐 Cross-Platform Development Setup - CRM System

## 📊 Development Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend PC   │    │ Backend Server  │    │   Database      │
│                 │    │  (Workspace)    │    │   (Docker)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Next.js (3000)  │◄──►│ NestJS (3001)   │◄──►│ PostgreSQL      │
│ React Query     │    │ Prisma ORM      │    │ (5432)          │
│ shadcn/ui       │    │ JWT Auth        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🖥️ **Frontend Development (Your PC)**

### Setup Instructions:
```bash
# 1. Clone repository to your PC
git clone https://github.com/shivam-9090/CRM-VISION.git
cd CRM-VISION/frontend

# 2. Install dependencies
npm install

# 3. Configure environment for remote backend
cp .env.example .env.local
```

### Environment Configuration (`frontend/.env.local`):
```env
# Backend API Configuration (Remote)
NEXT_PUBLIC_API_URL=http://[WORKSPACE_IP]:3001
NEXT_PUBLIC_API_BASE_URL=http://[WORKSPACE_IP]:3001/api

# Replace [WORKSPACE_IP] with actual workspace IP address
# Example: http://192.168.1.100:3001
```

### API Client Configuration (`frontend/lib/api.ts`):
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
```

### Start Frontend Development:
```bash
cd frontend
npm run dev
# Runs on: http://localhost:3000
```

---

## 🖧 **Backend Development (This Workspace)**

### Current Setup (Already Running):
```bash
# Backend server (Port 3001)
cd backend
npm run start:dev  # ✅ ALREADY RUNNING IN BACKGROUND

# Database (Docker)
docker-compose up -d  # ✅ ALREADY RUNNING
```

### Network Configuration for Cross-Platform:

#### 1. **Backend CORS Configuration** (`backend/src/main.ts`):
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for cross-platform development
  app.enableCors({
    origin: [
      'http://localhost:3000',        // Local frontend
      'http://[PC_IP]:3000',          // Remote PC frontend
      'http://192.168.1.*:3000',      // Network range
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.setGlobalPrefix('api');
  await app.listen(3001, '0.0.0.0'); // Listen on all interfaces
}
bootstrap();
```

#### 2. **Find Workspace IP Address**:
```bash
# Windows (Run in workspace)
ipconfig | findstr "IPv4"

# Linux/Mac (Run in workspace)  
hostname -I
```

#### 3. **Firewall Configuration** (Workspace):
```bash
# Windows: Allow port 3001 through firewall
# Go to Windows Defender Firewall > Advanced Settings > Inbound Rules
# Create new rule for port 3001

# Or use PowerShell (Run as Administrator):
New-NetFirewallRule -DisplayName "NestJS API" -Direction Inbound -Port 3001 -Protocol TCP -Action Allow
```

---

## 🔗 **Connection Testing**

### Test Backend Accessibility:
```bash
# From your PC, test if backend is reachable
curl http://[WORKSPACE_IP]:3001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Frontend-Backend Integration:
```bash
# 1. Start frontend on PC (Port 3000)
# 2. Verify API calls reach workspace backend (Port 3001)
# 3. Check browser network tab for successful API requests
```

---

## 📁 **Development Workflow**

### 1. **Frontend Development (Your PC)**:
```bash
# Daily workflow
git pull origin features
cd frontend
npm run dev

# Make UI changes, test with remote backend
# Commit frontend changes
git add frontend/
git commit -m "feat: update frontend feature"
git push origin features
```

### 2. **Backend Development (Workspace)**:
```bash
# Backend already running in background
# Make API changes, auto-reloads with nodemon

# Test endpoints
curl http://localhost:3001/api/activities

# Commit backend changes  
git add backend/
git commit -m "feat: update backend API"
git push origin features
```

### 3. **Database Management (Workspace)**:
```bash
cd backend

# Schema updates
npx prisma db push

# View data
npx prisma studio
# Access at: http://localhost:5555
```

---

## 🌍 **Network Configuration Examples**

### Common Network Scenarios:

#### **Same WiFi Network**:
```env
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
```

#### **Different Networks (VPN/Tunneling)**:
```bash
# Option 1: ngrok (Workspace)
npx ngrok http 3001
# Use generated URL in frontend env

# Option 2: VS Code Port Forwarding
# Use VS Code's built-in port forwarding feature
```

#### **Corporate Network**:
```env
# Use workspace's corporate IP
NEXT_PUBLIC_API_URL=http://10.0.0.50:3001
```

---

## 🛠️ **Development Tools Setup**

### VS Code Extensions (Recommended):
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "ms-vscode.remote-ssh"
  ]
}
```

### Git Configuration:
```bash
# Sync between PC and Workspace
git config --global push.autoSetupRemote true
git config --global pull.rebase true
```

---

## 🚀 **Production Deployment**

### Build Process:
```bash
# Frontend (PC)
cd frontend
npm run build
npm run export  # Static files

# Backend (Workspace)  
cd backend
npm run build   # Compiled JS

# Deploy together using Docker Compose
```

---

## 🔍 **Troubleshooting**

### Common Issues:

#### **CORS Errors**:
- ✅ Check backend CORS configuration
- ✅ Verify frontend API URL in env file
- ✅ Ensure backend listening on `0.0.0.0:3001`

#### **Connection Refused**:
- ✅ Check firewall settings on workspace
- ✅ Verify IP address is correct
- ✅ Ensure backend server is running

#### **Authentication Issues**:
- ✅ Check JWT token storage in browser
- ✅ Verify API base URL includes `/api` prefix
- ✅ Test login endpoint directly

---

## 📊 **Development Status**

| Component | Location | Status | Port | Access |
|-----------|----------|--------|------|--------|
| 🎨 Frontend | Your PC | Development | 3000 | `http://localhost:3000` |
| 🔧 Backend API | Workspace | Running | 3001 | `http://[WORKSPACE_IP]:3001` |
| 🗄️ Database | Workspace | Running | 5432 | Internal only |
| 📊 Prisma Studio | Workspace | Available | 5555 | `http://localhost:5555` |

**Next Steps**: Configure your PC frontend to connect to the workspace backend using the IP address and start cross-platform development! 🌐