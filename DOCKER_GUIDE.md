# Docker Build and Push Guide for CRM-VISION

## 📋 Prerequisites

1. **Docker Desktop** must be installed and running
2. **Docker Hub Account** (create one at https://hub.docker.com)
3. **Git Bash** or PowerShell

## 🚀 Quick Start

### Option 1: Using PowerShell Script (Recommended)

```powershell
# Run the automated script
.\docker-push.ps1

# Or specify custom username and version
.\docker-push.ps1 -Username "your-dockerhub-username" -Version "1.0.0"
```

### Option 2: Manual Commands

#### 1. Start Docker Desktop
Make sure Docker Desktop is running before proceeding.

#### 2. Login to Docker Hub
```bash
docker login
```
Enter your Docker Hub username and password.

#### 3. Build Images

**Backend (Production):**
```bash
docker build -t your-username/crm-vision-backend:latest -f backend/Dockerfile.prod ./backend
```

**Frontend (Production):**
```bash
docker build -t your-username/crm-vision-frontend:latest -f frontend/Dockerfile ./frontend
```

#### 4. Push Images to Docker Hub

```bash
docker push your-username/crm-vision-backend:latest
docker push your-username/crm-vision-frontend:latest
```

## 🏷️ Image Naming Convention

- **Backend**: `your-username/crm-vision-backend:version`
- **Frontend**: `your-username/crm-vision-frontend:version`

### Version Tags:
- `latest` - Latest stable version
- `1.0.0`, `1.0.1`, etc. - Specific versions
- `dev` - Development version

## 📦 Built Images

After building, you'll have:

1. **Backend Image** (`~200MB`)
   - Node.js 18 Alpine
   - NestJS application
   - Prisma ORM
   - Production optimized

2. **Frontend Image** (`~150MB`)
   - Node.js 18 Alpine
   - Next.js 15
   - Production build
   - Optimized static assets

## 🔍 Verify Images

```bash
# List local images
docker images | findstr crm-vision

# Check image details
docker inspect your-username/crm-vision-backend:latest
```

## 🌐 Pull Images (For Deployment)

Once pushed to Docker Hub, anyone can pull:

```bash
docker pull your-username/crm-vision-backend:latest
docker pull your-username/crm-vision-frontend:latest
```

## 📝 Using in docker-compose

Update `docker-compose.prod.yml` to use your images:

```yaml
services:
  backend:
    image: your-username/crm-vision-backend:latest
    # ... rest of config

  frontend:
    image: your-username/crm-vision-frontend:latest
    # ... rest of config
```

## 🛠️ Troubleshooting

### Docker not running
```powershell
# Check Docker status
docker version

# If error, start Docker Desktop manually
```

### Build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t your-username/crm-vision-backend:latest -f backend/Dockerfile.prod ./backend
```

### Push fails
```bash
# Re-login to Docker Hub
docker logout
docker login

# Try pushing again
docker push your-username/crm-vision-backend:latest
```

## 📊 Image Size Optimization

Current optimizations applied:
- ✅ Multi-stage builds
- ✅ Alpine Linux base
- ✅ Production dependencies only
- ✅ Non-root user for security
- ✅ Health checks included

## 🔐 Security Notes

- Images run as non-root user (UID 1001)
- Only production dependencies included
- No sensitive data in images
- Health checks configured

## 📚 Next Steps

After pushing images:
1. Update deployment scripts to use your images
2. Configure CI/CD pipeline for automated builds
3. Set up container registry scanning
4. Implement version tagging strategy

## 🎯 Deployment

Deploy using Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

Or use with Kubernetes, Render, AWS ECS, etc.
