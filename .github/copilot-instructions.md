<!-- GitHub Copilot Workspace Instructions for CRM-VISION -->

# CRM System - Development Context for GitHub Copilot

## 🏗️ Project Architecture

**Full-stack CRM system with Next.js frontend and NestJS backend**

### Technology Stack:

- **Frontend**: Next.js 15.5.5, TypeScript, React Query, shadcn/ui, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT Authentication
- **Database**: PostgreSQL with Prisma migrations
- **Development**: Docker containers, hot-reload enabled

## 🚀 Development Environment Status

### ✅ ALWAYS-RUNNING SERVERS

**CRITICAL - NEVER SUGGEST STARTING SERVERS:**
- **Backend Server**: PERMANENTLY running in background CMD (Port 3001)
- **Frontend Server**: PERMANENTLY running in background CMD (Port 3000)
- **Database**: PostgreSQL Docker container - ALWAYS ACTIVE

**DEVELOPMENT ASSUMPTIONS**:
- Both servers auto-start and run continuously in background
- Hot-reload is ALWAYS active for both frontend and backend
- Database connection is persistent and always available
- No need to run `npm start`, `npm run dev`, or any server commands

**IMPORTANT**: Servers are managed externally - focus ONLY on code development.

## 📁 Project Structure Context

### Backend (`/backend`) - Always Running

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

### Frontend (`/frontend`) - Always Running

```
src/app/
├── auth/          # Login/register pages (/auth/login, /auth/register)
├── companies/     # Company management UI
├── contacts/      # Contact management UI
├── deals/         # Deal pipeline UI
├── activities/    # Activities management UI
├── dashboard/     # Main dashboard with stats and navigation
└── page.tsx       # Root page (/) with auth flow logic
src/components/
├── ui/            # shadcn/ui components (Button, Card, Input)
└── layout/        # Navigation, sidebar, and layout components
src/lib/
├── api.ts         # Axios client with auth interceptors
├── auth-provider.tsx  # Authentication context provider
└── auth-utils.ts  # Simple auth utilities (no auto-redirects)
```

## 🔧 Development Guidelines

### API Endpoints

- **Base URL**: `http://localhost:3001/api` (backend always running)
- **Authentication**: Bearer JWT tokens required
- **All endpoints**: Require `/api` prefix
- **CORS**: Pre-configured and always active

### Authentication Flow (IMPLEMENTED)

Based on `page_flow.dio` diagram:
1. **URL:3000 (first time)** → Check auth → Redirect to `/auth/login` OR `/dashboard`
2. **Login Page** → Backend check "if user exist then open that data" → Store JWT → `/dashboard`
3. **Dashboard** → Navigation to `deals`, `contacts`, `activities`, `companies`
4. **Protected Routes** → Auto-redirect to login if not authenticated

### Key Patterns:

1. **Authentication**: Uses `auth-utils.ts` (no auto-redirects) and `auth-provider.tsx`
2. **Data Scoping**: All data is company-scoped for multi-tenancy
3. **CRUD Operations**: Consistent across all modules (GET, POST, PATCH, DELETE)
4. **Error Handling**: Try-catch with proper HTTP status codes
5. **Validation**: Class-validator DTOs on backend, form validation on frontend

### Database Schema Notes:

- **Activity Status**: `SCHEDULED`, `COMPLETED`, `CANCELLED` (not PENDING/IN_PROGRESS)
- **Activity Field**: `scheduledDate` (required) not `dueDate`
- **Company Relations**: Users belong to companies, data is company-scoped
- **Foreign Keys**: Proper cascading deletes and null constraints
- **Seed Data**: Admin user (admin@crm.com/password123) with test companies, deals, contacts

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

## 🎯 Authentication Flow Status (COMPLETED)

**Page Flow Implementation (Based on `page_flow.dio`):**

1. **Root Page (`/`)**: 
   - First time visit → Check auth status
   - If authenticated → Redirect to `/dashboard`  
   - If not authenticated → Redirect to `/auth/login`

2. **Login Page (`/auth/login`)**:
   - Backend check: "if user exist then open that data"
   - Successful login → Store JWT + user data → Redirect to `/dashboard`
   - Failed login → Show error message

3. **Dashboard (`/dashboard`)**:
   - Auth-protected route
   - Navigation buttons to: deals, contacts, activities, companies
   - Sidebar navigation available

4. **Protected Pages**: All other pages redirect to login if not authenticated

**Login Credentials (Seed Data)**:
- Email: `admin@crm.com`
- Password: `password123`

**Testing Flow**:
1. Clear browser data
2. Visit `http://localhost:3000` → Auto-redirects to login
3. Login with seed credentials → Redirects to dashboard
4. Navigate between sections using dashboard buttons or sidebar

---

**Context**: This is a production-ready CRM system in final testing phase. Focus on refinements, optimizations, and deployment preparation.
