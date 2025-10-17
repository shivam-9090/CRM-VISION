# CRM-VISION Quick Start Guide 🚀

## One-Command Setup

### Option 1: Automated Script (Recommended)

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Cross-Platform (Node.js):**
```bash
npm install
npm run setup
```

### Option 2: Docker Only
```bash
docker-compose up -d
```

### Option 3: Manual Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start database
docker-compose up -d postgres

# 4. Setup database
cd backend
npx prisma migrate dev
npx prisma db seed

# 5. Start servers
npm run start:dev  # Backend
cd ../frontend
npm run dev        # Frontend
```

## Access Your CRM

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001/api
- **Login**: admin@company.com / admin123

## Cross-Device Setup

1. **Find your IP**: `ipconfig` (Windows) or `hostname -I` (Linux)
2. **Update** `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://YOUR_IP:3001/api
   ```
3. **Access from any device**: `http://YOUR_IP:3000`

## Troubleshooting

### Port Issues
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID [PID_NUMBER] /F
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npx prisma migrate dev
```

### Clean Install
```bash
# Remove all containers and data
docker-compose down -v
docker system prune -a

# Remove node_modules
npm run clean

# Start fresh
npm run setup
```

## Support

- 📖 Full docs: `README.md`
- 🐛 Issues: [GitHub Issues](https://github.com/shivam-9090/CRM-VISION/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/shivam-9090/CRM-VISION/discussions)