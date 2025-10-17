# CRM-VISION 🚀

A full-stack CRM system built with Next.js frontend and NestJS backend, featuring lead management, deal tracking, and company/contact management.

## 🏗️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, React Query, shadcn/ui, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT Authentication
- **Database**: PostgreSQL with Docker
- **Development**: Docker Compose for easy setup

## 🚀 Quick Start (Recommended)

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/shivam-9090/CRM-VISION.git
cd CRM-VISION
```

### 2. Setup Environment
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit backend/.env with your database credentials (optional - Docker defaults work)
# Edit frontend/.env.local with your backend URL
```

### 3. Start with Docker (Easiest)
```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Manual Setup (Alternative)
```bash
# Start database only
docker-compose up -d postgres

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma db seed

# Start services
npm run start:dev  # Backend (port 3001)
cd ../frontend
npm run dev        # Frontend (port 3000)
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432 (postgres/postgres)

## 📱 Cross-Platform Setup

### For Network Access (Other Devices)

1. **Find Your IP Address**:
   ```bash
   # Windows
   ipconfig | findstr IPv4
   
   # Linux/Mac
   hostname -I
   ```

2. **Update Frontend Config**:
   ```bash
   # Edit frontend/.env.local
   NEXT_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3001/api
   ```

3. **Access from Other Devices**:
   - Frontend: `http://YOUR_IP_ADDRESS:3000`
   - Backend: `http://YOUR_IP_ADDRESS:3001/api`

## 🛠️ Development Commands

### Backend Commands
```bash
cd backend

# Development
npm run start:dev     # Hot reload
npm run build         # Build for production
npm run start:prod    # Run production build

# Database
npx prisma migrate dev      # Run migrations
npx prisma db push         # Push schema changes
npx prisma studio          # Database GUI
npx prisma db seed         # Seed test data
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev           # Development server
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Check code quality
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build -d

# Reset database
docker-compose down -v
docker-compose up -d
```

## 🗂️ Project Structure

```
CRM-VISION/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/      # Authentication
│   │   ├── user/      # User management
│   │   ├── company/   # Company CRUD
│   │   ├── contacts/  # Contact management
│   │   ├── deals/     # Deal pipeline
│   │   └── activities/# Task management
│   └── prisma/        # Database schema
├── frontend/          # Next.js App
│   ├── src/app/       # App router pages
│   ├── components/    # Reusable components
│   └── lib/           # Utilities
├── docker-compose.yml # Service orchestration
└── scripts/           # Setup scripts
```

## 🔐 Default Credentials

After seeding the database:
- **Email**: admin@company.com
- **Password**: admin123

## 🚀 Deployment

### Development Deployment
```bash
# Build and start production
docker-compose -f docker-compose.prod.yml up -d
```

### Production Deployment
1. Update environment variables for production
2. Set up reverse proxy (nginx)
3. Configure SSL certificates
4. Set up monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # Kill process or change ports in docker-compose.yml
   ```

2. **Database Connection Failed**:
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d postgres
   cd backend && npx prisma migrate dev
   ```

3. **Frontend Can't Connect to Backend**:
   - Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
   - Ensure backend is running on correct port
   - Check CORS settings in backend

4. **Docker Issues**:
   ```bash
   # Clean Docker
   docker system prune -a
   docker-compose down -v
   docker-compose up --build -d
   ```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@crmvision.com or open an issue on GitHub.

---

Made with ❤️ by [Shivam](https://github.com/shivam-9090)