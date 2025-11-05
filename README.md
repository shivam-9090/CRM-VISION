# 🚀 CRM System - Complete Customer Relationship Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-red)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, full-stack CRM system built with cutting-edge technologies. Features include deal pipeline management, contact management, activity tracking, analytics dashboard, and real-time notifications.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🔐 **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (ADMIN, MANAGER, EMPLOYEE)
  - Granular permission system
  - Two-factor authentication (2FA) support
  - Account lockout after failed login attempts
  - Password reset via email

- 👥 **Contact Management**
  - Create, read, update, delete contacts
  - Link contacts to companies
  - Track contact history and interactions
  - Search and filter contacts

- 🏢 **Company Management**
  - Multi-tenant architecture with company isolation
  - Company profiles with industry and metadata
  - View all contacts and deals per company

- 💼 **Deal Pipeline**
  - Visual deal pipeline (Lead → Qualified → Proposal → Negotiation → Won/Lost)
  - Deal value tracking and revenue projections
  - Expected close dates and priority management
  - Deal assignment to team members
  - Lead scoring and source tracking

- 📅 **Activity Management**
  - Tasks, calls, meetings, and notes
  - Activity scheduling with due dates
  - Link activities to deals and contacts
  - Activity status tracking (Scheduled, Completed, Cancelled)
  - Activity statistics and completion rates

- 📊 **Analytics Dashboard**
  - Deal pipeline analysis
  - Revenue projections (monthly, quarterly)
  - Activity completion metrics
  - Team performance tracking
  - Real-time data visualization

- 🔍 **Global Search**
  - Search across companies, contacts, and deals
  - Real-time search results
  - Advanced filtering options

- 🔔 **Notifications**
  - Real-time notifications via WebSocket
  - Email notifications
  - Activity reminders
  - Deal updates

- 📂 **File Management**
  - File attachments for deals, contacts, activities
  - Document upload and download
  - File type validation

- 💬 **Comments & Collaboration**
  - Threaded comments on deals and activities
  - @mentions for team collaboration
  - Comment history tracking

- 📝 **Audit Logging**
  - Track all system changes
  - User activity monitoring
  - Compliance and security auditing

- 📤 **Data Export**
  - Export contacts, deals, activities to CSV
  - Bulk data operations
  - Custom date range exports

---

## 🛠 Technology Stack

### Frontend
- **Framework**: [Next.js 15.5](https://nextjs.org/) (React 19)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **UI Components**: 
  - Radix UI (Dialog, Dropdown, Select, Toast)
  - Headless UI
  - Lucide Icons
- **State Management**: 
  - React Query (TanStack Query) for server state
  - React Hook Form for form management
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Drag & Drop**: @hello-pangea/dnd
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast, Sonner
- **Error Tracking**: Sentry

### Backend
- **Framework**: [NestJS 11.1](https://nestjs.com/)
- **Language**: TypeScript 5.7
- **Runtime**: Node.js 20+
- **Database ORM**: Prisma 6.18
- **Database**: PostgreSQL 15
- **Caching**: Redis 7 (ioredis)
- **Authentication**: 
  - Passport.js
  - JWT (jsonwebtoken)
  - bcrypt for password hashing
  - speakeasy for 2FA
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **Email**: Nodemailer
- **WebSocket**: Socket.IO
- **API Documentation**: Swagger/OpenAPI
- **Security**: 
  - Helmet (security headers)
  - Rate limiting (@nestjs/throttler)
  - Input sanitization (sanitize-html)
- **CSV Export**: json2csv
- **QR Code**: qrcode (for 2FA)
- **Error Tracking**: Sentry

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Database Migrations**: Prisma Migrate
- **Deployment**: Docker containers
- **Monitoring**: Sentry for error tracking

### Development Tools
- **Linting**: ESLint 9
- **Code Formatting**: Prettier 3.4
- **Testing**: Jest 30, Supertest
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

---

## 🏗 Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    Mobile    │  │   Desktop    │      │
│  │   (React)    │  │   (Future)   │  │   (Future)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Pages/Routes│  │  Components  │  │   API Layer  │      │
│  │  (App Router)│  │   (React)    │  │   (Axios)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ State Mgmt   │  │  WebSocket   │  │   Auth       │      │
│  │(React Query) │  │  (Socket.IO) │  │   Context    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS 11)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Controllers                         │   │
│  │  Auth│Users│Companies│Contacts│Deals│Activities      │   │
│  │  Analytics│Search│Notifications│Export│Attachments   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Middleware & Guards                  │   │
│  │  JWT Auth│Permissions│Rate Limiting│Validation       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Services (Business Logic)           │   │
│  │  AuthService│CompanyService│DealService│etc.         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Prisma     │  │   Redis      │  │  Socket.IO   │      │
│  │   (ORM)      │  │   (Cache)    │  │  (Real-time) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
         ┌──────────────┐  ┌──────────────┐
         │  PostgreSQL  │  │    Redis     │
         │  (Database)  │  │   (Cache)    │
         └──────────────┘  └──────────────┘
```

### Multi-Tenant Architecture
- **Company Isolation**: Each user belongs to one company
- **Data Scoping**: All queries automatically filtered by `companyId`
- **Security**: Row-level security ensures users only access their company's data
- **Scalability**: Designed for horizontal scaling with shared database

### Authentication Flow
```
1. User Registration → Creates User + Company
2. Login → JWT with {id, role, permissions, companyId}
3. Request → JWT validated → User context injected
4. Guards → Check permissions → Allow/Deny access
5. Data Access → Automatically scoped to user's company
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **PostgreSQL**: v15.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis**: v7.x or higher ([Download](https://redis.io/download))
- **Docker** (optional but recommended): Latest version ([Download](https://www.docker.com/))
- **Git**: Latest version ([Download](https://git-scm.com/))

---

## 🚀 Installation

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivam-9090/CRM-VISION.git
   cd CRM-VISION
   ```

2. **Copy environment files**
   ```bash
   cp .env.example .env
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

5. **Seed the database (optional)**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

### Option 2: Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivam-9090/CRM-VISION.git
   cd CRM-VISION
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   # Copy environment files
   cp .env.example .env
   
   # Edit .env with your database credentials
   # Update DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
   ```

5. **Start PostgreSQL and Redis**
   ```bash
   # Make sure PostgreSQL is running on port 5432
   # Make sure Redis is running on port 6379
   ```

6. **Run database migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

7. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

8. **Start the backend**
   ```bash
   npm run start:dev
   ```

9. **Start the frontend (in a new terminal)**
   ```bash
   cd ../frontend
   npm run dev
   ```

10. **Access the application**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:3001
    - API Documentation: http://localhost:3001/api/docs

---

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password_123@localhost:5432/crm_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Email Configuration (for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@crm-system.com

# Sentry (Error Tracking - Optional)
SENTRY_DSN=your-sentry-dsn
```

### Frontend Environment Variables

The frontend uses `NEXT_PUBLIC_` prefix for client-side variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NODE_ENV=development
```

---

## 🎮 Running the Application

### Development Mode

**Using Docker:**
```bash
docker-compose up
```

**Manual:**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Mode

**Using Docker:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Manual:**
```bash
# Build backend
cd backend
npm run build
npm run start:prod

# Build frontend
cd frontend
npm run build
npm start
```

### Default Login Credentials (After Seeding)

```
Email: admin@crm.com
Password: password123
```

⚠️ **Important**: Change these credentials immediately in production!

---

## 📚 API Documentation

### Swagger/OpenAPI Documentation

Once the backend is running, access interactive API documentation:

**URL**: http://localhost:3001/api/docs

### API Endpoints Overview

#### Authentication (`/api/auth`)
- `POST /auth/register` - Register new user + company
- `POST /auth/login` - Login and receive JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/verify` - Verify JWT token validity
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/2fa/setup` - Setup 2FA
- `POST /auth/2fa/verify` - Verify 2FA code

#### Users (`/api/users`)
- `GET /users` - List all users in company
- `GET /users/profile` - Get current user profile
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /users/invite` - Invite new team member

#### Companies (`/api/companies`)
- `GET /companies` - Get user's company
- `GET /companies/profile` - Get company profile
- `PATCH /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

#### Contacts (`/api/contacts`)
- `GET /contacts` - List all contacts (paginated)
- `POST /contacts` - Create new contact
- `GET /contacts/:id` - Get contact by ID
- `PATCH /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

#### Deals (`/api/deals`)
- `GET /deals` - List all deals (paginated)
- `POST /deals` - Create new deal
- `GET /deals/:id` - Get deal by ID
- `PATCH /deals/:id` - Update deal
- `DELETE /deals/:id` - Delete deal
- `GET /deals/by-stage` - Group deals by stage
- `GET /deals/:id/timeline` - Get deal timeline
- `POST /deals/bulk/delete` - Delete multiple deals
- `GET /deals/export` - Export deals to CSV

#### Activities (`/api/activities`)
- `GET /activities` - List all activities (paginated)
- `POST /activities` - Create new activity
- `GET /activities/:id` - Get activity by ID
- `PATCH /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity

#### Analytics (`/api/analytics`)
- `GET /analytics/overview` - Dashboard overview
- `GET /analytics/pipeline` - Deal pipeline analysis
- `GET /analytics/revenue` - Revenue projections
- `GET /analytics/activities` - Activity statistics
- `GET /analytics/team` - Team performance metrics

#### Search (`/api/search`)
- `GET /search?query=term` - Global search

#### Notifications (`/api/notifications`)
- `GET /notifications` - List user notifications
- `PATCH /notifications/:id` - Mark notification as read
- `POST /notifications` - Create notification

#### Comments (`/api/comments`)
- `GET /comments?entityType=deal&entityId=123` - Get comments
- `POST /comments` - Create comment
- `PATCH /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

#### Attachments (`/api/attachments`)
- `POST /attachments/upload` - Upload file
- `GET /attachments/:id` - Download file
- `DELETE /attachments/:id` - Delete file

#### Export (`/api/export`)
- `GET /export/contacts` - Export contacts to CSV
- `GET /export/deals` - Export deals to CSV
- `GET /export/activities` - Export activities to CSV

---

## 🗄️ Database Schema

### Core Models

#### User
- Stores user credentials, profile info, and permissions
- Fields: `id`, `email`, `password`, `name`, `role`, `permissions`, `companyId`
- Relationships: belongs to Company, has many Deals, Activities

#### Company
- Multi-tenant isolation unit
- Fields: `id`, `name`, `description`
- Relationships: has many Users, Contacts, Deals, Activities

#### Contact
- Customer/lead information
- Fields: `id`, `firstName`, `lastName`, `email`, `phone`, `companyId`
- Relationships: belongs to Company, has many Deals, Activities

#### Deal
- Sales opportunities
- Fields: `id`, `title`, `value`, `stage`, `expectedCloseDate`, `priority`, `leadScore`
- Stages: `LEAD`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`
- Relationships: belongs to Company, Contact, assigned to User, has many Activities

#### Activity
- Tasks, calls, meetings, notes
- Fields: `id`, `title`, `type`, `status`, `scheduledDate`, `description`
- Types: `TASK`, `CALL`, `MEETING`, `NOTE`
- Status: `SCHEDULED`, `COMPLETED`, `CANCELLED`
- Relationships: belongs to Company, linked to Contact and Deal

### Supporting Models

- **Comment**: Threaded comments on deals/activities
- **Attachment**: File uploads linked to entities
- **Notification**: User notifications
- **AuditLog**: System change tracking
- **Invite**: Team member invitations

### ER Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Company   │───┬───│    User     │       │  Activity   │
│             │   │   │             │       │             │
│ id          │   │   │ id          │───┬───│ id          │
│ name        │   │   │ email       │   │   │ title       │
│ description │   │   │ password    │   │   │ type        │
└─────────────┘   │   │ role        │   │   │ status      │
      │           │   │ companyId   │   │   │ companyId   │
      │           │   └─────────────┘   │   └─────────────┘
      │           │                     │
      │           │                     │
      ▼           ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Contact   │───────│    Deal     │
│             │       │             │
│ id          │       │ id          │
│ firstName   │       │ title       │
│ lastName    │       │ value       │
│ email       │       │ stage       │
│ companyId   │       │ companyId   │
└─────────────┘       │ contactId   │
                      │ assignedToId│
                      └─────────────┘
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

### Frontend Tests

```bash
cd frontend

# Run tests (when configured)
npm test
```

### Manual API Testing

Use the provided PowerShell scripts:

```powershell
# Test all endpoints
.\COMPLETE-SYSTEM-TEST.ps1

# Test analytics endpoints
.\test-analytics.ps1

# Test JWT permissions
.\test-jwt.ps1
```

Or use tools like:
- **Postman**: Import the Swagger/OpenAPI spec
- **Insomnia**: REST API client
- **cURL**: Command-line testing

---

## 🚢 Deployment

### Using Docker

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Push to registry**
   ```bash
   docker tag crm-backend:latest your-registry/crm-backend:latest
   docker push your-registry/crm-backend:latest
   
   docker tag crm-frontend:latest your-registry/crm-frontend:latest
   docker push your-registry/crm-frontend:latest
   ```

3. **Deploy to server**
   ```bash
   # On your production server
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment-Specific Configuration

**Production Checklist:**
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use production database credentials
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Configure Sentry for error tracking
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Change default admin password

### Backup Strategy

Use the provided backup scripts:

```bash
# Backup database
./scripts/backup-database.sh

# On Windows
.\scripts\backup-database.ps1
```

---

## 📁 Project Structure

```
CRM-VISION/
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   ├── migrations/        # Database migrations
│   │   ├── schema.prisma      # Prisma schema
│   │   └── seed.ts            # Database seeding
│   ├── src/
│   │   ├── activities/        # Activity management
│   │   ├── analytics/         # Analytics & reports
│   │   ├── attachments/       # File upload handling
│   │   ├── audit-log/         # Audit logging
│   │   ├── auth/              # Authentication & authorization
│   │   │   ├── guards/        # JWT, permissions guards
│   │   │   ├── decorators/    # Custom decorators
│   │   │   └── constants/     # Permission definitions
│   │   ├── comments/          # Comment system
│   │   ├── common/            # Shared utilities
│   │   ├── company/           # Company management
│   │   ├── config/            # Configuration
│   │   ├── contacts/          # Contact management
│   │   ├── deals/             # Deal pipeline
│   │   ├── export/            # CSV export
│   │   ├── health/            # Health checks
│   │   ├── notifications/     # Notification system
│   │   ├── prisma/            # Prisma service
│   │   ├── redis/             # Redis caching
│   │   ├── search/            # Global search
│   │   ├── user/              # User management
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Entry point
│   ├── test/                  # E2E tests
│   ├── uploads/               # File uploads storage
│   ├── Dockerfile             # Docker configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js Frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── activities/    # Activity pages
│   │   │   ├── auth/          # Login/Register
│   │   │   ├── companies/     # Company pages
│   │   │   ├── contacts/      # Contact pages
│   │   │   ├── dashboard/     # Dashboard
│   │   │   ├── deals/         # Deal pages
│   │   │   ├── export/        # Export pages
│   │   │   ├── profile/       # User profile
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── page.tsx       # Home page
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── layout/        # Navigation, sidebar
│   │   │   ├── comments/      # Comment components
│   │   │   └── ...
│   │   ├── lib/               # Utilities & helpers
│   │   │   ├── api.ts         # Axios client
│   │   │   ├── auth-provider.tsx  # Auth context
│   │   │   ├── auth-utils.ts  # Auth helpers
│   │   │   └── jwt-migration.ts  # JWT migration
│   │   └── middleware.ts      # Next.js middleware
│   ├── Dockerfile             # Docker configuration
│   ├── next.config.ts         # Next.js config
│   ├── package.json
│   ├── tailwind.config.ts     # Tailwind config
│   └── tsconfig.json
│
├── scripts/                    # Utility scripts
│   ├── backup-database.sh     # Database backup (Linux)
│   └── backup-database.ps1    # Database backup (Windows)
│
├── infra/                      # Infrastructure as Code
│   ├── main.tf                # Terraform config
│   └── render.yaml            # Render.com config
│
├── .github/                    # GitHub Actions (planned)
│
├── docker-compose.yml          # Development Docker Compose
├── docker-compose.prod.yml     # Production Docker Compose
├── .env.example                # Environment template
├── .gitignore
├── README.md                   # This file
└── SYSTEM_STATUS_REPORT.md     # System status documentation
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Style Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Shivam** - *Initial work* - [shivam-9090](https://github.com/shivam-9090)

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](#-api-documentation)
2. Review [System Status Report](SYSTEM_STATUS_REPORT.md)
3. Open an [issue](https://github.com/shivam-9090/CRM-VISION/issues)
4. Contact: [Your Email]

---

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ Authentication & Authorization
- ✅ Contact Management
- ✅ Deal Pipeline
- ✅ Activity Tracking
- ✅ Analytics Dashboard
- ✅ Global Search
- ✅ File Attachments
- ✅ Comments & Collaboration

### Future Enhancements (v1.1+)
- [ ] Mobile app (React Native)
- [ ] Calendar view for activities
- [ ] Email integration (Gmail, Outlook)
- [ ] Custom fields for deals/contacts
- [ ] Workflow automation
- [ ] Advanced reporting
- [ ] Team collaboration features
- [ ] API rate limiting per user
- [ ] Webhooks for integrations
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export to PDF
- [ ] Import from CSV/Excel
- [ ] Integration with third-party services

---

## 📊 System Status

Current Status: **Production Ready** ✅

- Backend: **100% Functional**
- Frontend: **100% Functional**
- Database: **Stable**
- Tests: **17/17 Passing**
- Security: **Implemented**
- Documentation: **Complete**

Last Updated: November 4, 2025

---

<div align="center">
  <p>Built with ❤️ using Next.js, NestJS, and PostgreSQL</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
