# 🐳 Docker Setup & Container Guide

**CRM-VISION** - Complete Docker containerization documentation

---

## 📋 Overview

Your project has **complete Docker support** with both development and production configurations:

### ✅ What You Have

1. **Development Setup** (`docker-compose.yml`)
   - Hot-reload enabled for both frontend & backend
   - Volume mounts for live code changes
   - PostgreSQL + Redis containers
   - Health checks configured

2. **Production Setup** (`docker-compose.prod.yml`)
   - Optimized multi-stage builds
   - No port exposure (except through reverse proxy)
   - Security hardened
   - Resource limits configured

3. **Dockerfiles**
   - `backend/Dockerfile` - Development backend
   - `backend/Dockerfile.prod` - Production backend (optimized)
   - `frontend/Dockerfile` - Production-ready Next.js build

4. **Docker Ignore Files**
   - `backend/.dockerignore` - Excludes tests, docs, dev files
   - `frontend/.dockerignore` - Excludes .next, node_modules, etc.

---

## 🚀 Quick Start

### Development Mode (Recommended for Development)

```powershell
# 1. Create .env file from example
Copy-Item .env.example .env

# 2. Edit .env with your settings (optional, has defaults)
notepad .env

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### Production Mode

```powershell
# 1. Create production environment file
Copy-Item .env.production.example .env.production

# 2. Edit .env.production with STRONG secrets
notepad .env.production

# 3. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 4. View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📦 Container Structure

### Development Containers

| Container | Port | Purpose | Volume Mounted |
|-----------|------|---------|----------------|
| `crm-postgres-dev` | 5432 | PostgreSQL database | ✅ Yes (persistent) |
| `crm-redis-dev` | 6379 | Redis cache | ✅ Yes (persistent) |
| `crm-backend-dev` | 3001 | NestJS API | ✅ Yes (live reload) |
| `crm-frontend-dev` | 3000 | Next.js UI | ✅ Yes (live reload) |

### Production Containers

| Container | Port | Purpose | Security |
|-----------|------|---------|----------|
| `crm-postgres-prod` | - | PostgreSQL (internal only) | 🔒 No external access |
| `crm-redis-prod` | - | Redis (internal only) | 🔒 No external access |
| `crm-backend-prod` | 3001 | NestJS API | ✅ Health checks |
| `crm-frontend-prod` | 3000 | Next.js UI | ✅ Optimized build |

---

## 🔧 Docker Commands Cheat Sheet

### Build & Start

```powershell
# Build all images from scratch
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Rebuild and start
docker-compose up -d --build
```

### Monitoring

```powershell
# View all running containers
docker ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Check container health
docker-compose ps
```

### Database Operations

```powershell
# Run Prisma migrations
docker-compose exec backend npx prisma migrate dev

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Access PostgreSQL shell
docker-compose exec postgres psql -U dev_user -d crm_dev
```

### Cleanup

```powershell
# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ DELETES DATA)
docker-compose down -v

# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Full cleanup (⚠️ NUCLEAR OPTION)
docker system prune -a --volumes -f
```

---

## 📁 File Structure

```
CRM_01/
├── docker-compose.yml              # Development orchestration
├── docker-compose.prod.yml         # Production orchestration
├── .env.example                    # Development env template
├── .env.production.example         # Production env template
│
├── backend/
│   ├── Dockerfile                  # Dev Dockerfile
│   ├── Dockerfile.prod             # Production Dockerfile (optimized)
│   ├── .dockerignore               # Excludes unnecessary files
│   └── prisma/
│       └── schema.prisma           # Database schema
│
├── frontend/
│   ├── Dockerfile                  # Production Next.js Dockerfile
│   ├── .dockerignore               # Excludes .next, node_modules
│   └── next.config.ts              # Next.js configuration
│
└── scripts/
    ├── backup-database.sh          # Backup script (Linux)
    └── backup-database.ps1         # Backup script (Windows)
```

---

## ⚙️ Configuration Files Breakdown

### 1. `docker-compose.yml` (Development)

**Purpose**: Local development with hot-reload

**Key Features**:
- ✅ Volumes mounted for live code changes
- ✅ Ports exposed to host (5432, 6379, 3000, 3001)
- ✅ Default credentials (safe for dev)
- ✅ Health checks enabled

**Services**:
```yaml
postgres:  # Port 5432, database
redis:     # Port 6379, cache
backend:   # Port 3001, API with hot-reload
frontend:  # Port 3000, Next.js with fast refresh
```

### 2. `docker-compose.prod.yml` (Production)

**Purpose**: Optimized production deployment

**Key Features**:
- 🔒 No database ports exposed
- 🔒 Secrets from `.env.production`
- ⚡ Multi-stage builds for smaller images
- 📊 Resource limits configured
- ❤️ Health checks with retries

**Security Improvements**:
- Non-root users for backend/frontend
- No volume mounts (immutable containers)
- Environment variables from secure file
- Compressed logging with rotation

### 3. `backend/Dockerfile` (Development)

```dockerfile
FROM node:18-alpine        # Lightweight base
WORKDIR /app               # Set working directory
RUN npm ci                 # Install dependencies
RUN npx prisma generate    # Generate Prisma client
CMD ["npm", "run", "start:dev"]  # Hot-reload mode
```

### 4. `backend/Dockerfile.prod` (Production)

**Multi-stage build**:
1. **Stage 1**: Install production dependencies
2. **Stage 2**: Build application
3. **Stage 3**: Run with minimal footprint

**Optimizations**:
- ✅ Only production dependencies
- ✅ Non-root user (security)
- ✅ Health check with wget
- ✅ Compressed final image

### 5. `frontend/Dockerfile` (Production)

**Next.js optimized build**:
1. **deps**: Install dependencies
2. **builder**: Build Next.js app
3. **runner**: Serve with minimal image

**Features**:
- Standalone output for smaller size
- Static assets optimization
- Non-root user execution

---

## 🔍 Troubleshooting

### Container won't start

```powershell
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Database connection failed

```powershell
# Check if postgres is healthy
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check connection string in .env
# DATABASE_URL=postgresql://dev_user:dev_password_123@postgres:5432/crm_dev
```

### Port already in use

```powershell
# Find process using port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Stop conflicting process or change port in .env
# PORT=3002
```

### Prisma client not generated

```powershell
# Generate client inside container
docker-compose exec backend npx prisma generate

# Or rebuild container
docker-compose build --no-cache backend
```

### Hot-reload not working

```powershell
# Ensure volumes are mounted correctly
docker-compose down
docker-compose up -d

# Check volume in docker-compose.yml:
# volumes:
#   - ./backend:/app
#   - /app/node_modules
```

---

## 🚀 Deployment Options

### Option 1: Docker on VPS (Recommended)

```bash
# 1. SSH to server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/shivam-9090/CRM-VISION.git
cd CRM-VISION

# 3. Create production env
cp .env.production.example .env.production
nano .env.production

# 4. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 5. Setup SSL with Nginx reverse proxy
```

### Option 2: Render.com (Platform as a Service)

Already configured in `infra/render.yaml`

```bash
# Deploy using Render Blueprint
render.yaml defines:
- PostgreSQL database
- Redis cache
- Backend web service
- Frontend web service
```

### Option 3: AWS/Azure/GCP

Use `docker-compose.prod.yml` as reference for:
- ECS (AWS)
- Container Instances (Azure)
- Cloud Run (GCP)

---

## 📊 Image Sizes (Approximate)

| Image | Development | Production |
|-------|-------------|------------|
| Backend | ~450 MB | ~180 MB |
| Frontend | ~500 MB | ~120 MB |
| PostgreSQL | ~240 MB | ~240 MB |
| Redis | ~40 MB | ~40 MB |

**Total**: ~1.2 GB (dev) / ~580 MB (prod)

---

## ✅ Pre-Deployment Checklist

### Development
- [ ] `.env` file created from `.env.example`
- [ ] Docker Desktop installed and running
- [ ] Ports 3000, 3001, 5432, 6379 available
- [ ] Run `docker-compose up -d`
- [ ] Check `http://localhost:3000`

### Production
- [ ] `.env.production` created with **STRONG** secrets
- [ ] JWT_SECRET is 32+ characters random string
- [ ] POSTGRES_PASSWORD is strong (16+ chars)
- [ ] FRONTEND_URL and NEXT_PUBLIC_API_URL set to production domains
- [ ] Run pre-deployment check: `.\pre-deploy-check.ps1`
- [ ] All tests passing
- [ ] Database backups configured

---

## 🔐 Security Notes

### Development (Current Setup) ✅
- Default credentials are fine for local development
- Ports exposed for easy access
- Volume mounts for hot-reload

### Production ⚠️
**BEFORE DEPLOYING TO PRODUCTION**:

1. **Generate Strong Secrets**:
   ```powershell
   # Generate JWT secret (32+ chars)
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
   
   # Generate DB password (16+ chars)
   -join ((65..90) + (97..122) + (48..57) + (33..47) | Get-Random -Count 16 | % {[char]$_})
   ```

2. **Never Commit `.env.production`**:
   ```bash
   # Already in .gitignore, but verify
   git check-ignore .env.production  # Should output: .env.production
   ```

3. **Use Environment-Specific URLs**:
   ```
   FRONTEND_URL=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://api.your-domain.com
   ```

---

## 📈 Monitoring

### Health Checks

All services have health checks configured:

```powershell
# Check health status
docker-compose ps

# Backend health endpoint
curl http://localhost:3001/api/health

# Response:
# {
#   "status": "ok",
#   "database": { "status": "connected" },
#   "uptime": 12345
# }
```

### Logs

```powershell
# Real-time logs (all services)
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## 🎯 Next Steps

1. **Start Development**:
   ```powershell
   docker-compose up -d
   # Visit http://localhost:3000
   ```

2. **Make Changes**:
   - Edit code in `backend/` or `frontend/`
   - Changes auto-reload in containers

3. **Run Migrations**:
   ```powershell
   docker-compose exec backend npx prisma migrate dev
   ```

4. **Test Production Build**:
   ```powershell
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Deploy to Production** (when ready):
   - See `PRODUCTION_DEPLOYMENT.md`
   - Run `.\pre-deploy-check.ps1`

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure Docker Desktop is running
4. Try rebuilding: `docker-compose build --no-cache`

---

**Status**: ✅ Production Ready  
**Last Updated**: October 25, 2025  
**Docker Version**: 24.0+  
**Docker Compose Version**: 2.0+
