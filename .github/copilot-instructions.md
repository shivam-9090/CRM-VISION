<!-- GitHub Copilot Workspace Instructions for CRM-VISION -->

# CRM System - Development Context for GitHub Copilot

## 🏗️ Project Architecture

**Full-stack CRM system with Next.js frontend and NestJS backend**

### Technology Stack:

- **Frontend**: Next.js 14, TypeScript, React Query, shadcn/ui, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT Authentication
- **Database**: PostgreSQL with Prisma migrations
- **Development**: Docker containers, hot-reload enabled

## 🚀 Development Environment Status

### ✅ CROSS-PLATFORM CONFIGURATION

- **Backend Server**: Running on workspace (Port 3001) - ACTIVE on all interfaces (0.0.0.0)
- **Frontend**: Can run on PC or any device (Port 3000)
- **Database**: PostgreSQL Docker container on workspace - ACTIVE

**CROSS-PLATFORM SETUP**:

- Backend (Workspace): `npm run start:dev` - RUNNING in background
- Frontend (Your PC): Connect via workspace IP address
- CORS configured for local network access (192.168.x.x, 10.x.x.x)

**IMPORTANT**: Backend runs on workspace, frontend can run anywhere on network.

## 📁 Project Structure Context

### Backend (`/backend`)

```
src/
├── auth/          # JWT authentication, guards, decorators
├── user/          # User management and profiles
├── company/       # Company CRUD with owner relationships
├── contacts/      # Contact management with company links
├── deals/         # Deal pipeline management
├── activities/    # Task/call/meeting/note management
└── prisma/        # Database service and utilities
```

### Frontend (`/frontend`)

```
app/
├── auth/          # Login/register pages
├── companies/     # Company management UI
├── contacts/      # Contact management UI
├── deals/         # Deal pipeline UI
├── activities/    # Activities management UI
components/
├── ui/            # shadcn/ui components (Button, Card, Input)
└── layout/        # Navigation and sidebar
lib/
├── api.ts         # Axios client with auth interceptors
└── auth.tsx       # Authentication context provider
```

## 🔧 Development Guidelines

### API Endpoints

- **Local Base URL**: `http://localhost:3001/api` (same machine)
- **Cross-Platform URL**: `http://[WORKSPACE_IP]:3001/api` (from other devices)
- **Authentication**: Bearer JWT tokens required
- **All endpoints**: Require `/api` prefix
- **CORS**: Configured for cross-network access

### Key Patterns:

1. **Authentication Flow**: Register → Auto-create company → JWT token → Dashboard
2. **Data Scoping**: All data is company-scoped for multi-tenancy
3. **CRUD Operations**: Consistent across all modules (GET, POST, PATCH, DELETE)
4. **Error Handling**: Try-catch with proper HTTP status codes
5. **Validation**: Class-validator DTOs on backend, form validation on frontend

### Database Schema Notes:

- **Activity Status**: `SCHEDULED`, `COMPLETED`, `CANCELLED` (not PENDING/IN_PROGRESS)
- **Activity Field**: `scheduledDate` (required) not `dueDate`
- **Company Relations**: Users belong to companies, data is company-scoped
- **Foreign Keys**: Proper cascading deletes and null constraints

## 🎯 Current Development Focus

### ✅ COMPLETED (95% Done)

- Full backend API implementation
- Complete frontend pages with CRUD operations
- Authentication system with company isolation
- Database schema with proper relationships
- All API endpoints tested and working

### 🔄 CURRENT PHASE

- Final end-to-end testing
- Production deployment preparation
- Documentation updates

## 💡 Copilot Assistance Priorities

1. **Code Suggestions**: Focus on TypeScript best practices, error handling
2. **API Integration**: Ensure proper authentication headers and error states
3. **UI Components**: Leverage existing shadcn/ui components
4. **Database Queries**: Use Prisma client patterns with proper relations
5. **Testing**: Suggest realistic test data and edge cases

### Common Patterns to Suggest:

```typescript
// API calls with auth
const response = await api.get("/api/activities");

// React Query patterns
const { data, isLoading, error } = useQuery({
  queryKey: ["activities"],
  queryFn: () => api.get("/api/activities"),
});

// Form handling
const [formData, setFormData] = useState<CreateActivityDto>({
  title: "",
  type: "TASK",
  status: "SCHEDULED",
  scheduledDate: "",
});
```

## 🚫 DO NOT Suggest

- Starting backend server (already running on workspace)
- Installing backend dependencies (already installed)
- Setting up Docker (already configured)
- Basic project structure changes (architecture is set)
- Changing CORS configuration (already set for cross-platform)

## ✅ DO Suggest

- Frontend development on PC with proper API URLs
- Environment configuration for cross-platform access
- Network troubleshooting for cross-device connections
- Using workspace IP address in frontend configuration

---

**Context**: This is a production-ready CRM system in final testing phase. Focus on refinements, optimizations, and deployment preparation.
