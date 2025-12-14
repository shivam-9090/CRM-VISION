# 🏗️ CRM System - Complete Architecture Documentation

---

## 1. FULL SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE CRM ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────┐
                          │   FRONTEND       │
                          │  (Next.js 15)    │
                          │  React 18        │
                          │  TailwindCSS     │
                          └────────┬─────────┘
                                   │
                        ┌──────────┴──────────┐
                        │   HTTP/REST API    │
                        │   (Port 3000)      │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼────────┐          ┌────────▼─────────┐
            │   API GATEWAY  │          │  AUTHENTICATION  │
            │  (NestJS 11)   │          │  (JWT Tokens)    │
            │  Port 3001     │          │  (Role-based)    │
            └───────┬────────┘          └────────┬─────────┘
                    │                            │
        ┌───────────┴────────────┬──────────────┘
        │                        │
   ┌────▼──────────┐    ┌─────────▼──────────┐
   │   SERVICES    │    │  MIDDLEWARE        │
   ├───────────────┤    ├──────────────────┤
   │ • Auth        │    │ • CORS            │
   │ • User        │    │ • Rate Limiting   │
   │ • Task        │    │ • Logging         │
   │ • Employee    │    │ • Error Handling  │
   │ • Activity    │    │ • Sanitization    │
   │ • Email       │    └──────────────────┘
   │ • Analytics   │
   │ • Search      │
   │ • Audit Log   │
   │ • Redis Cache │
   └────┬──────────┘
        │
    ┌───┴────────────────┬─────────────────┬──────────────┐
    │                    │                 │              │
┌───▼──────┐    ┌────────▼────┐    ┌──────▼──┐    ┌────▼────┐
│ POSTGRES │    │    REDIS    │    │  EMAIL  │    │  FILE   │
│ (11.0)   │    │  (Caching)  │    │  (SES)  │    │ STORAGE │
│          │    │  (Queues)   │    │         │    │         │
│ ◄─────────────────────────────────────────────────────────┐
│          │    │             │    │ SMTP    │    │         │
│ Database │    │ Bull Queues │    │ Service │    │ Uploads │
│ Schema   │    │             │    │         │    │         │
└──────────┘    └─────────────┘    └─────────┘    └─────────┘

        ┌──────────────────────────────────────────┐
        │      EXTERNAL SERVICES                   │
        ├──────────────────────────────────────────┤
        │ • AWS SES (Email)                        │
        │ • Google Calendar API (Sync)             │
        │ • File Upload Storage                    │
        └──────────────────────────────────────────┘
```

---

## 2. BACKEND ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND ARCHITECTURE                            │
│                      (NestJS 11.1.7)                                │
└─────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │  API Routes  │
                          │  HTTP Server │
                          │  Port: 3001  │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Global Middleware    │
                    │ ┌────────────────────┐ │
                    │ │ • CORS              │ │
                    │ │ • Body Parser       │ │
                    │ │ • Compression       │ │
                    │ │ • Error Handler     │ │
                    │ │ • Logger            │ │
                    │ └────────────────────┘ │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
      ┌─────▼──────┐    ┌────────▼────────┐    ┌────▼──────┐
      │   MODULES  │    │   CONTROLLERS   │    │  SERVICES │
      ├────────────┤    ├─────────────────┤    ├───────────┤
      │ • Auth     │    │ • auth          │    │ • Auth    │
      │ • User     │    │ • user          │    │ • User    │
      │ • Task     │    │ • task          │    │ • Task    │
      │ • Employee │    │ • employee      │    │ • Employee│
      │ • Activity │    │ • activity      │    │ • Activity│
      │ • Contact  │    │ • contact       │    │ • Contact │
      │ • Deal     │    │ • deal          │    │ • Deal    │
      │ • Email    │    │ • email         │    │ • Email   │
      │ • Search   │    │ • search        │    │ • Search  │
      │ • Analytics│    │ • analytics     │    │ • Analytics
      │ • Audit    │    │ • audit-log     │    │ • Audit   │
      │ • Common   │    │ • health        │    │ • Common  │
      │ • Redis    │    │ • health        │    │ • Redis   │
      │ • Prisma   │    └─────────────────┘    │ • Prisma  │
      └────┬───────┘                            └────┬──────┘
           │                                         │
           └──────────────┬──────────────────────────┘
                          │
            ┌─────────────▼──────────────┐
            │    GUARDS & PIPES          │
            ├────────────────────────────┤
            │ • JWT Auth Guard           │
            │ • Role-Based Guard         │
            │ • Rate Limit Pipe          │
            │ • Validation Pipe          │
            │ • Transform Pipe           │
            └─────────────┬──────────────┘
                          │
            ┌─────────────▼──────────────┐
            │   DECORATORS               │
            ├────────────────────────────┤
            │ • @UseGuards()             │
            │ • @Roles()                 │
            │ • @UsePipes()              │
            │ • @UseInterceptors()       │
            │ • @UseFilters()            │
            └─────────────┬──────────────┘
                          │
            ┌─────────────▼──────────────┐
            │   DATA ACCESS LAYER        │
            ├────────────────────────────┤
            │ Prisma ORM                 │
            │ • Query Builder            │
            │ • Relationships            │
            │ • Migrations               │
            │ • Schema Definition        │
            └─────────────┬──────────────┘
                          │
            ┌─────────────▼──────────────┐
            │   DATABASE CONNECTIONS     │
            ├────────────────────────────┤
            │ • PostgreSQL (Primary)     │
            │ • Redis (Cache/Queue)      │
            │ • Bull (Job Queue)         │
            └────────────────────────────┘
```

---

## 3. API ROUTING DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     API ROUTING & INTERCONNECTIONS                        │
└─────────────────────────────────────────────────────────────────────────┘

BASE URL: http://localhost:3001/api

┌─ AUTH ROUTES (public)
│  ├─ POST   /auth/register           → Create new account
│  ├─ POST   /auth/login              → Login & get JWT token
│  ├─ POST   /auth/refresh            → Refresh expired token
│  ├─ POST   /auth/logout             → Invalidate token
│  └─ POST   /auth/forgot-password    → Password reset
│
├─ USER ROUTES (private - auth required)
│  ├─ GET    /users                   → Get all users (company-scoped)
│  ├─ GET    /users/:id               → Get single user
│  ├─ PUT    /users/:id               → Update user profile
│  ├─ DELETE /users/:id               → Delete user
│  ├─ POST   /users/verify-email/:token → Verify email (if needed)
│  └─ GET    /users/employees         → Get all employees
│
├─ EMPLOYEE ROUTES (private - MANAGER role)
│  ├─ POST   /users/employees         → Add new employee
│  ├─ GET    /users/employees         → List all employees
│  ├─ PUT    /users/employees/:id     → Update employee
│  ├─ DELETE /users/employees/:id     → Delete employee
│  └─ GET    /users/employees/:id/performance → Performance data
│
├─ TASK ROUTES (private)
│  ├─ GET    /tasks                   → Get all tasks (filtered by role)
│  ├─ GET    /tasks/:id               → Get task details
│  ├─ POST   /tasks                   → Create new task
│  ├─ PUT    /tasks/:id               → Update task
│  ├─ PATCH  /tasks/:id/status        → Change task status
│  ├─ DELETE /tasks/:id               → Delete task
│  ├─ POST   /tasks/:id/verify        → Verify task completion
│  ├─ POST   /tasks/:id/assign        → Assign employee to task
│  └─ GET    /tasks/by-status/:status → Get tasks by status
│
├─ ACTIVITY ROUTES (private)
│  ├─ GET    /activities              → Get all activities
│  ├─ GET    /activities/:id          → Get activity details
│  ├─ POST   /activities              → Create activity
│  ├─ PUT    /activities/:id          → Update activity
│  ├─ DELETE /activities/:id          → Delete activity
│  └─ POST   /activities/:id/complete → Mark as completed
│
├─ CONTACT ROUTES (private)
│  ├─ GET    /contacts                → Get all contacts
│  ├─ GET    /contacts/:id            → Get contact
│  ├─ POST   /contacts                → Create contact
│  ├─ PUT    /contacts/:id            → Update contact
│  ├─ DELETE /contacts/:id            → Delete contact
│  └─ GET    /contacts/search/:query  → Search contacts
│
├─ DEAL ROUTES (private)
│  ├─ GET    /deals                   → Get all deals
│  ├─ GET    /deals/:id               → Get deal details
│  ├─ POST   /deals                   → Create deal
│  ├─ PUT    /deals/:id               → Update deal
│  ├─ DELETE /deals/:id               → Delete deal
│  ├─ PATCH  /deals/:id/stage         → Change deal stage
│  └─ GET    /deals/by-stage/:stage   → Get deals by stage
│
├─ ANALYTICS ROUTES (private - ADMIN/MANAGER)
│  ├─ GET    /analytics/dashboard     → Dashboard metrics
│  ├─ GET    /analytics/performance   → Employee performance
│  ├─ GET    /analytics/tasks-stats   → Task statistics
│  ├─ GET    /analytics/revenue       → Revenue analytics
│  └─ GET    /analytics/trends        → Trend analysis
│
├─ EMAIL ROUTES (private)
│  ├─ POST   /email/send              → Send custom email
│  ├─ GET    /email/templates         → Get email templates
│  └─ POST   /email/test              → Test email setup
│
├─ SEARCH ROUTES (private)
│  ├─ GET    /search/global           → Global search
│  ├─ GET    /search/tasks            → Search tasks
│  ├─ GET    /search/contacts         → Search contacts
│  └─ GET    /search/deals            → Search deals
│
├─ AUDIT LOG ROUTES (private - ADMIN)
│  ├─ GET    /audit-logs              → Get audit logs
│  ├─ GET    /audit-logs/:id          → Get log entry
│  └─ GET    /audit-logs/by-user/:id  → Logs by user
│
├─ NOTIFICATION ROUTES (private)
│  ├─ GET    /notifications           → Get notifications
│  ├─ PATCH  /notifications/:id/read  → Mark as read
│  ├─ DELETE /notifications/:id       → Delete notification
│  └─ POST   /notifications/settings  → Update preferences
│
└─ HEALTH ROUTES (public)
   └─ GET    /health                  → System health check

```

---

## 4. SERVICE INTERCONNECTIONS DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│              HOW SERVICES CONNECT & COMMUNICATE                        │
└──────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ AUTH SERVICE │
                          └──────┬───────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
            ┌──────────┐  ┌────────────┐  ┌───────────┐
            │ JWT Gen  │  │ Password   │  │ Role      │
            │ & Verify │  │ Hash/Check │  │ Validation│
            └────┬─────┘  └────┬───────┘  └─────┬─────┘
                 │             │               │
                 └─────────────┬────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  USER SERVICE      │
                    └──────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐    ┌──────────────┐    ┌──────────┐
   │ PRISMA  │    │ EMAIL        │    │ ANALYTICS
   │ (CRUD)  │    │ SERVICE      │    │ SERVICE
   └────┬────┘    └──────┬───────┘    └────┬─────┘
        │                │                 │
        │    ┌───────────▼────────────┐    │
        │    │ Task created/updated   │    │
        │    │ → Send notification    │    │
        │    │ → Log to audit         │    │
        │    └────────────────────────┘    │
        │                                  │
        ▼                                  ▼
   ┌─────────────────┐            ┌──────────────┐
   │  TASK SERVICE   │            │ AUDIT LOG    │
   ├─────────────────┤            │ SERVICE      │
   │ • Create        │            ├──────────────┤
   │ • Assign        │            │ • Log events │
   │ • Update status │◄───────────│ • Track      │
   │ • Verify        │   Logs all │  changes     │
   │ • Delete        │   actions  │ • User trail │
   └────────┬────────┘            └──────────────┘
            │
            ├────────────┬────────────┐
            │            │            │
            ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌─────────────┐
       │EMPLOYEE  │ │ACTIVITY  │ │NOTIFICATION│
       │SCORE SVC │ │SERVICE   │ │SERVICE      │
       ├──────────┤ ├──────────┤ ├─────────────┤
       │Calculate │ │Track     │ │Push alerts  │
       │points    │ │actions   │ │Send email   │
       │Awards    │ │Schedule  │ │Real-time    │
       │Badges    │ │Reminders │ │updates      │
       └────┬─────┘ └────┬─────┘ └──────┬──────┘
            │            │             │
            └────────────┼─────────────┘
                         │
                    ┌────▼────────┐
                    │REDIS CACHE  │
                    │& BULL QUEUE │
                    │             │
                    │ • Queue jobs│
                    │ • Cache data│
                    │ • Background│
                    │   tasks     │
                    └─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH SERVICE FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query ──► Search Service ──► PostgreSQL Full Text Search  │
│                       │                                          │
│                       ├──► Index Tasks, Contacts, Deals          │
│                       │                                          │
│                       ├──► Cache Results in Redis                │
│                       │                                          │
│                       └──► Return Ranked Results                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              EMAIL SERVICE INTEGRATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Event (Task Created, User Added, etc.)                          │
│       │                                                          │
│       └──► Email Service ──► Format Template ──► AWS SES SMTP   │
│                       │                                          │
│                       ├──► Add to Queue (Bull)                   │
│                       │                                          │
│                       ├──► Log in Audit                          │
│                       │                                          │
│                       └──► Retry on Failure                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. TECHNOLOGY STACK ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│              TECHNOLOGY STACK - INTERCONNECTIONS                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              PRESENTATION TIER                               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                              │   │
│  │  Framework: Next.js 15.5.5                                  │   │
│  │  ├─ TypeScript                                              │   │
│  │  ├─ React 18.3.1                                            │   │
│  │  │  ├─ Hooks (useState, useEffect, useContext)              │   │
│  │  │  ├─ Components (Functional)                              │   │
│  │  │  └─ Context API (State Management)                       │   │
│  │  ├─ TailwindCSS 3.x (Styling)                               │   │
│  │  ├─ PostCSS (CSS Processing)                                │   │
│  │  │                                                           │   │
│  │  Utilities:                                                  │   │
│  │  ├─ React Query (Data Fetching/Caching)                      │   │
│  │  ├─ Axios (HTTP Client)                                      │   │
│  │  ├─ React Hot Toast (Notifications)                          │   │
│  │  ├─ React Icons (UI Icons)                                   │   │
│  │  └─ date-fns (Date Formatting)                               │   │
│  │                                                              │   │
│  │  Features:                                                  │   │
│  │  ├─ App Router (File-based routing)                          │   │
│  │  ├─ Server Components                                        │   │
│  │  ├─ API Routes Middleware                                    │   │
│  │  ├─ Automatic Code Splitting                                 │   │
│  │  └─ SSR + SSG + ISR                                          │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   HTTP/REST API         │
                    │   (JSON Serialization)  │
                    │   Port: 3000            │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Authentication         │
                    │  JWT Tokens             │
                    │  Stored in Cookies      │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                      BACKEND LAYER                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │            APPLICATION TIER                                    │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │                                                                │  │
│  │  Runtime: Node.js 20                                          │  │
│  │  Language: TypeScript 5.x                                     │  │
│  │                                                                │  │
│  │  Framework: NestJS 11.1.7                                     │  │
│  │  ├─ Controllers (Route Handlers)                               │  │
│  │  ├─ Services (Business Logic)                                  │  │
│  │  ├─ Modules (Feature Encapsulation)                            │  │
│  │  ├─ Decorators (@Injectable, @Controller, @Module)            │  │
│  │  ├─ Guards (Authorization)                                     │  │
│  │  ├─ Pipes (Data Transformation)                                │  │
│  │  ├─ Interceptors (Request/Response)                            │  │
│  │  ├─ Filters (Exception Handling)                               │  │
│  │  └─ Middleware (Cross-Cutting Concerns)                        │  │
│  │                                                                │  │
│  │  Authentication: passport-jwt                                 │  │
│  │  Validation: class-validator, class-transformer               │  │
│  │  Security: bcrypt, helmet, rate-limiter                       │  │
│  │  API Documentation: Swagger/OpenAPI                           │  │
│  │                                                                │  │
│  │  Job Scheduling: @nestjs/schedule, Bull                       │  │
│  │  Caching: @nestjs/cache-manager, Redis                        │  │
│  │  Email: nodemailer (SMTP)                                     │  │
│  │  Search: PostgreSQL Full-Text Search                          │  │
│  │  Logging: winston, pino                                       │  │
│  │  Environment: dotenv                                          │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Data Access Layer     │
                    │   Prisma ORM            │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                     DATA LAYER / PERSISTENCE                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  PRIMARY DATABASE: PostgreSQL 16                            │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  Tables (11 Main + Relations):                             │    │
│  │  ├─ users                 (Users/Employees)                │    │
│  │  ├─ companies             (Organizations)                  │    │
│  │  ├─ tasks                 (Task Management)                │    │
│  │  ├─ contacts              (Customer Contacts)              │    │
│  │  ├─ deals                 (Sales Deals)                    │    │
│  │  ├─ activities            (Actions/Logs)                   │    │
│  │  ├─ comments              (Task Comments)                  │    │
│  │  ├─ notifications         (User Alerts)                    │    │
│  │  ├─ audit_logs            (Change Tracking)                │    │
│  │  ├─ employee_scores       (Performance Metrics)            │    │
│  │  └─ score_history         (Performance History)            │    │
│  │                                                             │    │
│  │  Features:                                                 │    │
│  │  ├─ Migrations (@prisma/migrate)                           │    │
│  │  ├─ Relationships (1-to-N, N-to-N)                         │    │
│  │  ├─ Indexes (Performance)                                  │    │
│  │  ├─ Constraints (Data Integrity)                           │    │
│  │  ├─ Full-Text Search (Search Vector)                       │    │
│  │  └─ Soft Deletes (Data Protection)                         │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  CACHE LAYER: Redis 7.x                                    │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ├─ In-Memory Cache (Session Data)                          │    │
│  │  ├─ Job Queue (Bull - Background Tasks)                     │    │
│  │  │  ├─ Email Notifications                                  │    │
│  │  │  ├─ Audit Log Processing                                 │    │
│  │  │  ├─ Performance Calculations                             │    │
│  │  │  └─ Scheduled Tasks                                      │    │
│  │  ├─ Rate Limiting (Token Bucket)                            │    │
│  │  └─ Session Storage                                         │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  EXTERNAL SERVICES                                         │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ├─ AWS SES (Email SMTP Service)                            │    │
│  │  │  ├─ SMTP Host: email-smtp.us-east-1.amazonaws.com      │    │
│  │  │  ├─ Port: 587 (TLS)                                      │    │
│  │  │  └─ Authentication (IAM SMTP Credentials)                │    │
│  │  │                                                          │    │
│  │  ├─ Google Calendar API (Optional Sync)                     │    │
│  │  │  └─ OAuth2 Integration                                   │    │
│  │  │                                                          │    │
│  │  └─ File Storage (Local/Cloud)                              │    │
│  │     └─ Attachments & Exports                                │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                    FULL DATA FLOW EXAMPLE                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER ACTION: Create Task                                              │
│       │                                                                │
│       ├─ Browser (React) ──────► TypeScript                           │
│       │                                                                │
│       ├─ HTTP POST /api/tasks                                          │
│       │        ▼                                                       │
│       │  NestJS Controller                                             │
│       │  └─ Route Handler (TypeScript)                                 │
│       │        ▼                                                       │
│       │  Guards & Pipes (Validation)                                   │
│       │        ▼                                                       │
│       │  Service Layer (Business Logic - TypeScript)                   │
│       │        ▼                                                       │
│       │  Prisma ORM (Query Builder)                                    │
│       │        ▼                                                       │
│       │  PostgreSQL (SQL Execution)                                    │
│       │  └─ INSERT INTO tasks (...)                                    │
│       │        ▼                                                       │
│       │  Response (JSON)                                               │
│       │        ▼                                                       │
│       │  Redis Queue (Bull) - Async Tasks                              │
│       │  ├─ Send notification email (Nodemailer → AWS SES)             │
│       │  ├─ Update employee score (PostgreSQL)                         │
│       │  ├─ Log audit entry (PostgreSQL)                               │
│       │  └─ Cache update                                               │
│       │        ▼                                                       │
│       └─ Browser (React) ◄──── Response                                │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. DATABASE SCHEMA RELATIONSHIPS

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                                 │
│                    (Prisma Schema Mapping)                               │
└──────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │  COMPANIES   │
                            │              │
                            │ id (PK)      │◄─────────────────────┐
                            │ name         │                      │
                            │ description  │                      │
                            └──────┬───────┘                      │
                                   │ (1-to-N)                    │
                    ┌──────────────┴─────────────────┐           │
                    │                                │           │
            ┌───────▼────────┐              ┌────────▼──────┐   │
            │     USERS      │              │   CONTACTS    │   │
            ├────────────────┤              ├───────────────┤   │
            │ id (PK)        │              │ id (PK)       │   │
            │ email          │              │ firstName     │   │
            │ password       │              │ lastName      │   │
            │ name           │              │ email         │   │
            │ role           │              │ phone         │   │
            │ companyId (FK) │──────────────│ companyId (FK)│   │
            │ isVerified     │              └───────────────┘   │
            │ createdAt      │                                   │
            │ updatedAt      │                                   │
            └──┬───────────┬─┘                                   │
               │           │                                     │
        (1-to-N)      (1-to-N)                                  │
           │               │                                     │
      ┌────▼────┐     ┌────▼──────┐                             │
      │  TASKS  │     │ ACTIVITIES │                            │
      ├─────────┤     ├────────────┤                            │
      │ id (PK) │     │ id (PK)    │                            │
      │ title   │     │ title      │                            │
      │ desc... │     │ type       │                            │
      │ status  │     │ status     │                            │
      │ priority│     │ scheduled..│                            │
      │ type    │     │ assignedId │                            │
      │ assign..│     │ companyId  │                            │
      │ assign..│     │ userId (FK)│◄──────────────┐           │
      │ company │     │ createdAt  │               │           │
      │ created..     │ updatedAt  │               │           │
      │ updated..     └────────────┘               │           │
      └────┬────────────────────────────────┐     │           │
           │                                │     │           │
           └────────┬──────────┬────────────┘     │           │
                    │          │                  │           │
              ┌─────▼──┐  ┌────▼──────┐          │           │
              │ COMMENTS│  │    DEALS  │          │           │
              ├────────┤  ├───────────┤          │           │
              │ id     │  │ id        │          │           │
              │ content│  │ title     │          │           │
              │ taskId │  │ value     │          │           │
              │ userId │  │ stage     │          │           │
              │ created│  │ contactId │          │           │
              └────────┘  │ assignedId│          │           │
                          │ companyId │          │           │
                          │ created   │          │           │
                          └───────────┘          │           │
                                                 │           │
                          ┌──────────────────────┘           │
                          │                                  │
                    ┌─────▼───────────┐                     │
                    │ EMPLOYEE_SCORES │                     │
                    ├─────────────────┤                     │
                    │ id (PK)         │                     │
                    │ userId (FK)────────────────────────────
                    │ score           │
                    │ rank            │
                    │ completedTasks  │
                    │ badges          │
                    │ updatedAt       │
                    └────────┬────────┘
                             │ (1-to-N)
                       ┌─────▼──────────┐
                       │ SCORE_HISTORY  │
                       ├────────────────┤
                       │ id (PK)        │
                       │ employeeId     │
                       │ points         │
                       │ reason         │
                       │ awardedBy (FK) │
                       │ createdAt      │
                       └────────────────┘

                       ┌────────────────┐
                       │  AUDIT_LOGS    │
                       ├────────────────┤
                       │ id (PK)        │
                       │ userId (FK)    │
                       │ action         │
                       │ entity         │
                       │ changes        │
                       │ companyId (FK) │
                       │ timestamp      │
                       └────────────────┘

                    ┌──────────────────┐
                    │ NOTIFICATIONS    │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ userId (FK)      │
                    │ message          │
                    │ type             │
                    │ isRead           │
                    │ createdAt        │
                    └──────────────────┘
```

---

## 📋 TEXT-BASED TECHNICAL DOCUMENTATION

### **COMPLETE TECHNOLOGY STACK**

#### **Frontend Stack**

- **Framework:** Next.js 15.5.5 (React meta-framework)
- **Language:** TypeScript 5.x
- **UI Library:** React 18.3.1 (Component-based architecture)
- **Styling:** TailwindCSS 3.x (Utility-first CSS)
- **CSS Processing:** PostCSS (CSS transformations)
- **Data Fetching:** React Query (Tanstack Query) - Server state management
- **HTTP Client:** Axios - Promise-based HTTP client
- **UI Components:** Custom + React Icons (SVG icons)
- **Date Handling:** date-fns (Modern date utility)
- **Notifications:** React Hot Toast (Toast notifications)
- **State Management:** React Context API (Local state)
- **Form Management:** React Hook Form (Optional)
- **Hosting:** Netlify / Railway / Vercel ready

#### **Backend Stack**

- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.x (Strongly typed JavaScript)
- **Framework:** NestJS 11.1.7 (Opinionated Node.js framework)
- **API:** REST API (JSON over HTTP)
- **Authentication:** JWT (JSON Web Tokens) via passport-jwt
- **Password Hashing:** bcrypt (Secure password storage)
- **Validation:** class-validator, class-transformer (DTO validation)
- **Security:** helmet, express-rate-limit (CORS, Security headers)
- **API Documentation:** Swagger/OpenAPI (Auto-generated docs)
- **Logging:** winston, pino (Structured logging)
- **Job Queue:** Bull (Background tasks with Redis)
- **Caching:** @nestjs/cache-manager (Redis-backed cache)
- **Email:** nodemailer (SMTP email client)
- **ORM:** Prisma 6.18.0 (Type-safe database client)
- **Environment:** dotenv (Config from .env files)
- **Testing:** Jest (Unit tests)
- **Code Quality:** ESLint (Linting), Prettier (Formatting)

#### **Database Stack**

- **Primary:** PostgreSQL 16 (Relational database)
- **Features:**
  - Full-Text Search (GIN indexes)
  - UUID/CUID primary keys
  - JSON/JSONB columns (Flexible data)
  - Foreign key constraints
  - Transactions (ACID compliance)
  - Connection pooling
- **Cache Layer:** Redis 7.x (In-memory data store)
  - Session storage
  - Job queue (Bull)
  - Cache layer
  - Rate limiting

#### **External Services**

- **Email:** AWS SES SMTP (email-smtp.us-east-1.amazonaws.com:587)
- **Calendar:** Google Calendar API (OAuth2 integration)
- **File Storage:** Local filesystem / Cloud storage ready
- **Container Orchestration:** Docker & Docker Compose

---

### **HOW COMPONENTS WORK TOGETHER**

#### **1. User Authentication Flow**

```
User Login (Frontend)
  → React Component (TypeScript)
  → Axios HTTP POST /auth/login (JSON)
  → NestJS Controller (TypeScript)
  → Passport JWT Guard (Middleware)
  → Auth Service (Business Logic - TypeScript)
  → Prisma ORM (Query Builder)
  → PostgreSQL (SQL: SELECT users WHERE email = ?)
  → bcrypt.compare() (Password verification)
  → JWT Token Generation
  → Response with Token (JSON)
  → React Query Cache Update
  → Frontend State Update
  → Redirect to Dashboard
```

#### **2. Task Creation & Notification Flow**

```
Create Task (Frontend)
  → React Form (TypeScript)
  → Axios POST /tasks (JSON payload)
  → NestJS Controller
  → Guards (JWT Auth, Role-based)
  → Pipes (Data validation, transformation)
  → Task Service (TypeScript - Business Logic)
  → Prisma ORM (Transaction)
  → PostgreSQL INSERT (SQL)
  → Response with Created Task
  → Bull Queue (Redis) - Background Job
    ├─ Send Email (Nodemailer → AWS SES SMTP)
    ├─ Update Employee Score (PostgreSQL)
    ├─ Log Audit Entry (PostgreSQL)
    └─ Update Cache (Redis)
  → Frontend Toast Notification
  → React Query Refetch
  → UI List Updates
```

#### **3. Search & Caching Flow**

```
Global Search Query (Frontend)
  → React Search Component (TypeScript)
  → Axios GET /search/global?q=term
  → NestJS Controller
  → Search Service (TypeScript)
  → Redis Cache Check (In-memory)
    ├─ Cache HIT → Return cached results
    └─ Cache MISS:
      → PostgreSQL Full-Text Search (GIN Index)
      → Query Results (SQL)
      → Store in Redis (TTL: 1 hour)
      → Return to Frontend (JSON)
  → React Query Cache
  → Frontend Renders Results
```

#### **4. Email Service Integration**

```
Event Triggered (Task Created, User Added, etc.)
  → Backend Service Event
  → Email Service (TypeScript)
  → Template Rendering (Handlebars)
  → Add to Bull Queue (Redis)
  → Email Worker Process
  → nodemailer SMTP Transport
  → AWS SES SMTP Server (email-smtp.us-east-1.amazonaws.com:587)
  → Email Sent to Recipient
  → Log in Audit (PostgreSQL)
  → Update Notification Status
  → Retry on Failure (Bull Queue)
```

#### **5. Performance Metrics Calculation**

```
Time-based Trigger (Daily at midnight)
  → Bull Scheduler Job
  → Analytics Service (TypeScript)
  → Query Prisma/PostgreSQL:
    ├─ Get all users' tasks
    ├─ Calculate completion rates
    ├─ Sum points awarded
    └─ Compare with history
  → Employee Score Service
  → Update employee_scores table
  → Create score_history entries
  → Cache results in Redis
  → Trigger notification if milestone reached
  → Email user about performance
```

---

### **ARCHITECTURE PRINCIPLES**

#### **1. Layered Architecture**

- **Presentation Layer:** React/Next.js (UI components)
- **API Layer:** NestJS Controllers (Route handlers)
- **Business Logic:** Services (TypeScript classes)
- **Data Access:** Prisma ORM (Query abstraction)
- **Database:** PostgreSQL (Persistent storage)

#### **2. Separation of Concerns**

- Controllers: Handle HTTP requests only
- Services: Contain business logic
- Guards/Pipes: Cross-cutting concerns
- Filters: Exception handling
- Middlewares: Request preprocessing

#### **3. Security**

- JWT tokens (Stateless authentication)
- Role-based access control (Guards)
- Password hashing (bcrypt)
- Input validation (Pipes)
- Rate limiting (Helmet + express-rate-limit)
- CORS enabled
- SQL injection prevention (Prisma)

#### **4. Performance Optimization**

- Redis caching (Frequently accessed data)
- Database indexes (Query optimization)
- Bull job queue (Async processing)
- React Query (Frontend caching)
- Pagination (Large datasets)
- Full-text search (Efficient searching)

#### **5. Scalability**

- Stateless backend (Easy horizontal scaling)
- Database connection pooling
- Redis for distributed caching
- Bull for distributed job queue
- Docker containerization
- Environment-based configuration

---

### **TECHNOLOGY INTERCONNECTIONS SUMMARY**

| Layer              | Technology      | Language   | Purpose                    |
| ------------------ | --------------- | ---------- | -------------------------- |
| **Frontend**       | Next.js 15      | TypeScript | UI/UX, Client-side routing |
| **Frontend State** | React Query     | TypeScript | Server state, caching      |
| **Frontend Style** | TailwindCSS     | CSS        | Responsive styling         |
| **API Transport**  | Axios           | TypeScript | HTTP requests              |
| **Backend**        | NestJS 11       | TypeScript | API, business logic        |
| **Auth**           | Passport JWT    | TypeScript | Token validation           |
| **Validation**     | class-validator | TypeScript | DTO validation             |
| **Database**       | Prisma          | TypeScript | ORM, migrations            |
| **Database**       | PostgreSQL      | SQL        | Relational data            |
| **Cache**          | Redis           | Protocol   | In-memory store            |
| **Queue**          | Bull            | Node.js    | Background jobs            |
| **Email**          | nodemailer      | Node.js    | SMTP client                |
| **Email SMTP**     | AWS SES         | HTTPS      | Email sending              |
| **Logging**        | winston         | Node.js    | Application logs           |
| **Container**      | Docker          | YAML       | Containerization           |
| **Deployment**     | Railway/Render  | YAML       | Cloud hosting              |

---

### **KEY ARCHITECTURAL DECISIONS**

1. **Monolithic Backend:** All services in one NestJS application

   - Easier to develop
   - Simpler to deploy
   - Can migrate to microservices later

2. **Synchronous API:** REST endpoints with JSON

   - Simple and proven
   - Good for CRUD operations
   - Can add WebSocket later for real-time

3. **Async Background Jobs:** Bull Queue for email/processing

   - Non-blocking operations
   - Reliable job execution
   - Retry mechanisms

4. **Relational Database:** PostgreSQL

   - Data integrity
   - Complex queries
   - Strong consistency
   - ACID transactions

5. **Type Safety:** TypeScript everywhere
   - Compile-time type checking
   - Better IDE support
   - Fewer runtime errors
   - Self-documenting code

---

### **DEPLOYMENT ARCHITECTURE**

```
GitHub Repository
       ↓
Docker Build (Dockerfile)
       ↓
┌─────────────────────────────┐
│  Docker Hub / Registry      │
│  • crm-frontend:latest      │
│  • crm-backend:latest       │
└────────┬────────────────────┘
         ↓
┌──────────────────────────────┐
│  Railway/Render/Vercel       │
│  ├─ Frontend (Next.js)       │
│  ├─ Backend (NestJS)         │
│  ├─ PostgreSQL               │
│  └─ Redis                    │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│  AWS Services                │
│  ├─ SES (Email)              │
│  └─ S3 (Optional Storage)     │
└──────────────────────────────┘
         ↓
User Browsers (HTTPS)
```

---

### **DATA FLOW SUMMARY**

1. **User Input:** React component
2. **HTTP Request:** Axios → NestJS API
3. **Authentication:** JWT verification
4. **Validation:** DTOs with class-validator
5. **Business Logic:** TypeScript services
6. **Database Query:** Prisma ORM → PostgreSQL
7. **Response:** JSON serialization
8. **Async Tasks:** Bull Queue → Background processing
9. **Email:** nodemailer → AWS SES
10. **Caching:** Results stored in Redis
11. **Frontend Update:** React Query + React state
12. **Audit Logging:** All changes tracked in PostgreSQL

---

### **MONITORING & OBSERVABILITY**

- **Logging:** Winston/Pino structured logs
- **Health Checks:** `/health` endpoint
- **Error Tracking:** Sentry (optional)
- **Performance:** APM tools (optional)
- **Audit Trail:** Database audit_logs table
- **Notifications:** Email alerts on critical events

---

## 7. CLOUD ARCHITECTURE DIAGRAM (DevOps)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  CLOUD DEPLOYMENT ARCHITECTURE                        │
│                  (Multi-Cloud / Hybrid Setup)                         │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌────────────┐     ┌──────────────┐              │
│  │   GitHub    │     │   GitHub   │     │    GitHub    │              │
│  │  Repository │ ──► │   Actions  │ ──► │   Releases   │              │
│  │  (Git Push) │     │  (Workflow)│     │  (Artifacts) │              │
│  └─────────────┘     └────────────┘     └──────┬───────┘              │
│                            │                    │                      │
│                    ┌───────┴────────┐           │                      │
│                    ▼                ▼           ▼                      │
│            ┌──────────────┐  ┌──────────────────────┐                 │
│            │ Unit Tests   │  │ Integration Tests    │                 │
│            │ Jest/Mocha   │  │ API Tests            │                 │
│            │ Coverage     │  │ E2E Tests            │                 │
│            └──────┬───────┘  └─────────┬────────────┘                 │
│                   │                    │                              │
│                   └────────┬───────────┘                              │
│                            ▼                                          │
│                   ┌────────────────────┐                              │
│                   │  Code Quality      │                              │
│                   │  • ESLint          │                              │
│                   │  • Prettier        │                              │
│                   │  • SonarQube       │                              │
│                   │  • Security Scan   │                              │
│                   └────────┬───────────┘                              │
│                            ▼                                          │
│                   ┌────────────────────┐                              │
│                   │ Build Artifacts    │                              │
│                   │ • Docker Images    │                              │
│                   │ • Compiled Code    │                              │
│                   │ • Dependencies     │                              │
│                   └────────┬───────────┘                              │
│                            ▼                                          │
│            ┌──────────────────────────────┐                           │
│            │  Docker Registry (Hub)       │                           │
│            │  • frontend:latest           │                           │
│            │  • frontend:v1.0.0           │                           │
│            │  • backend:latest            │                           │
│            │  • backend:v1.0.0            │                           │
│            └─────────────┬────────────────┘                           │
│                          ▼                                            │
│            ┌──────────────────────────────┐                           │
│            │ Deploy to Staging            │                           │
│            │ • Test environment           │                           │
│            │ • Smoke tests                │                           │
│            │ • Load testing               │                           │
│            └─────────────┬────────────────┘                           │
│                          ▼                                            │
│            ┌──────────────────────────────┐                           │
│            │ Deploy to Production         │                           │
│            │ • Blue-Green deploy          │                           │
│            │ • Rollback capability        │                           │
│            │ • Health checks              │                           │
│            └──────────────────────────────┘                           │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE SETUP                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              CLOUD PROVIDER OPTIONS                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌─ RAILWAY (Current Primary)                                   │  │
│  │  │  ├─ Containerized deployment                                 │  │
│  │  │  ├─ PostgreSQL managed database                              │  │
│  │  │  ├─ Redis in-memory cache                                    │  │
│  │  │  ├─ Environment-based configs                                │  │
│  │  │  ├─ GitHub integration                                       │  │
│  │  │  ├─ Auto-scaling                                             │  │
│  │  │  └─ Monitoring dashboard                                     │  │
│  │  │                                                              │  │
│  │  ├─ RENDER (Alternative)                                        │  │
│  │  │  ├─ Free tier available                                      │  │
│  │  │  ├─ PostgreSQL managed service                               │  │
│  │  │  ├─ Cron jobs support                                        │  │
│  │  │  ├─ Private services                                         │  │
│  │  │  ├─ GitHub auto-deploy                                       │  │
│  │  │  └─ Log streaming                                            │  │
│  │  │                                                              │  │
│  │  ├─ AWS (Enterprise Scale)                                      │  │
│  │  │  ├─ EC2 (Virtual Machines)                                   │  │
│  │  │  ├─ RDS (Managed PostgreSQL)                                 │  │
│  │  │  ├─ ElastiCache (Redis)                                      │  │
│  │  │  ├─ SES (Email Service) ✓ Already used                       │  │
│  │  │  ├─ S3 (Object Storage)                                      │  │
│  │  │  ├─ CloudFront (CDN)                                         │  │
│  │  │  ├─ IAM (Identity Management)                                │  │
│  │  │  ├─ CloudWatch (Monitoring)                                  │  │
│  │  │  ├─ Auto Scaling Groups                                      │  │
│  │  │  └─ Load Balancing                                           │  │
│  │  │                                                              │  │
│  │  └─ VERCEL (Frontend Hosting)                                   │  │
│  │     ├─ Next.js optimized                                        │  │
│  │     ├─ Edge Functions                                           │  │
│  │     ├─ Image Optimization                                       │  │
│  │     ├─ Analytics                                                │  │
│  │     ├─ A/B Testing                                              │  │
│  │     └─ Automatic HTTPS                                          │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│               KUBERNETES ORCHESTRATION (Optional)                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    K8s CLUSTER                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │           INGRESS (Load Balancer)                     │   │   │
│  │  │  nginx-ingress / Istio                                │   │   │
│  │  │  ├─ SSL/TLS Termination                                │   │   │
│  │  │  ├─ Route to Services                                  │   │   │
│  │  │  └─ Rate Limiting                                      │   │   │
│  │  └──────────────┬─────────────────────────────────────────┘   │   │
│  │                 │                                              │   │
│  │    ┌────────────┼────────────┬────────────┐                   │   │
│  │    │            │            │            │                   │   │
│  │  ┌─▼──────┐  ┌──▼────────┐  ┌─▼──────┐  ┌─▼──────────┐       │   │
│  │  │Frontend│  │ Backend   │  │ Redis  │  │ PostgreSQL │       │   │
│  │  │Service │  │ Service   │  │ Cache  │  │ StatefulSet       │   │
│  │  │        │  │           │  │        │  │            │       │   │
│  │  │Pods: 3 │  │Pods: 5    │  │Pod: 1  │  │Pod: 1      │       │   │
│  │  └────────┘  └───────────┘  └────────┘  └────────────┘       │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐      │   │
│  │  │       PERSISTENT VOLUMES (PV)                       │      │   │
│  │  │  ├─ PostgreSQL Data                                 │      │   │
│  │  │  ├─ Redis Data                                      │      │   │
│  │  │  └─ Application Logs                                │      │   │
│  │  └─────────────────────────────────────────────────────┘      │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐      │   │
│  │  │       CONFIGMAPS & SECRETS                          │      │   │
│  │  │  ├─ Environment Variables                           │      │   │
│  │  │  ├─ Database Credentials                            │      │   │
│  │  │  ├─ API Keys                                        │      │   │
│  │  │  └─ TLS Certificates                                │      │   │
│  │  └─────────────────────────────────────────────────────┘      │   │
│  │                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐      │   │
│  │  │       HORIZONTAL POD AUTOSCALER (HPA)               │      │   │
│  │  │  ├─ CPU Threshold: 80%                              │      │   │
│  │  │  ├─ Memory Threshold: 85%                           │      │   │
│  │  │  ├─ Min Replicas: 2                                 │      │   │
│  │  │  └─ Max Replicas: 10                                │      │   │
│  │  └─────────────────────────────────────────────────────┘      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE AS CODE (IaC)                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Terraform (AWS/GCP/Azure)                                          │
│  │  ├─ main.tf (Infrastructure definition)                            │
│  │  ├─ variables.tf (Input variables)                                 │
│  │  ├─ outputs.tf (Output values)                                     │
│  │  ├─ vpc.tf (Network setup)                                         │
│  │  ├─ rds.tf (Database configuration)                                │
│  │  ├─ elasticache.tf (Redis configuration)                           │
│  │  ├─ security_groups.tf (Firewall rules)                            │
│  │  └─ terraform.tfstate (State management)                           │
│  │                                                                     │
│  ├─ Kubernetes Manifests (YAML)                                        │
│  │  ├─ deployment.yaml (Pod specifications)                           │
│  │  ├─ service.yaml (Load Balancing)                                  │
│  │  ├─ ingress.yaml (External Access)                                 │
│  │  ├─ configmap.yaml (Configuration)                                 │
│  │  ├─ secret.yaml (Sensitive data)                                   │
│  │  ├─ pvc.yaml (Persistent storage)                                  │
│  │  ├─ hpa.yaml (Auto-scaling rules)                                  │
│  │  └─ networkpolicy.yaml (Network rules)                             │
│  │                                                                     │
│  ├─ Docker Compose (Local/Staging)                                     │
│  │  └─ docker-compose.yml (Service definitions)                       │
│  │                                                                     │
│  └─ Ansible (Configuration Management)                                 │
│     ├─ site.yml (Main playbook)                                       │
│     ├─ roles/ (Reusable configurations)                                │
│     │  ├─ docker/                                                     │
│     │  ├─ nginx/                                                      │
│     │  └─ monitoring/                                                 │
│     └─ inventory.yml (Hosts configuration)                             │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│               MONITORING & LOGGING ARCHITECTURE                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Application Logs (stdout/stderr)                                      │
│       │                                                                │
│       ├─► ELK Stack (Elasticsearch, Logstash, Kibana)                 │
│       │   ├─ Elasticsearch (Log storage & indexing)                   │
│       │   ├─ Logstash (Log processing)                                │
│       │   └─ Kibana (Visualization & dashboards)                      │
│       │                                                                │
│       ├─► CloudWatch (AWS)                                            │
│       │   ├─ Logs Insights                                            │
│       │   ├─ Metrics Dashboard                                        │
│       │   └─ Alarms & Alerts                                          │
│       │                                                                │
│       └─► Datadog / New Relic                                         │
│           ├─ APM (Application Performance Monitoring)                 │
│           ├─ Infrastructure Monitoring                                │
│           ├─ Real-time alerts                                         │
│           └─ Custom dashboards                                        │
│                                                                         │
│  Metrics Collection                                                    │
│       │                                                                │
│       ├─► Prometheus                                                  │
│       │   ├─ Time-series database                                     │
│       │   ├─ Node exporter (System metrics)                           │
│       │   ├─ cAdvisor (Container metrics)                             │
│       │   └─ Custom metrics (NestJS)                                  │
│       │                                                                │
│       ├─► Grafana                                                     │
│       │   ├─ Dashboard creation                                       │
│       │   ├─ Alert management                                         │
│       │   ├─ Visualization                                            │
│       │   └─ Notification routing                                     │
│       │                                                                │
│       └─► StatsD (Lightweight metrics)                                │
│           └─ UDP-based metric collection                              │
│                                                                         │
│  Error Tracking & Alerting                                             │
│       │                                                                │
│       ├─► Sentry                                                      │
│       │   ├─ Exception tracking                                       │
│       │   ├─ Release tracking                                         │
│       │   ├─ Performance monitoring                                   │
│       │   └─ Alert routing                                            │
│       │                                                                │
│       ├─► PagerDuty / OpsGenie                                        │
│       │   ├─ Incident management                                      │
│       │   ├─ On-call scheduling                                       │
│       │   ├─ Escalation policies                                      │
│       │   └─ Notification channels                                    │
│       │                                                                │
│       └─► Slack Integration                                           │
│           ├─ Alert notifications                                      │
│           ├─ Deployment logs                                          │
│           └─ Incident updates                                         │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│              COMPLETE DEVOPS WORKFLOW                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Developer                                                              │
│    │ Commits Code                                                      │
│    ▼                                                                   │
│  GitHub Repository (main/develop/feature branches)                     │
│    │ Push Event Trigger                                                │
│    ▼                                                                   │
│  GitHub Actions Workflow                                               │
│    ├─ Trigger: push/pull_request/manual                                │
│    ├─ Checkout code                                                    │
│    ├─ Run tests (Jest, E2E)                                            │
│    ├─ Code quality scan (ESLint, SonarQube)                            │
│    ├─ Security scan (Snyk, Trivy)                                      │
│    ├─ Build Docker images                                              │
│    ├─ Push to Docker registry                                          │
│    └─ Trigger deployment                                               │
│    ▼                                                                   │
│  Staging Environment (Railway/Render/K8s)                              │
│    ├─ Smoke tests                                                      │
│    ├─ Integration tests                                                │
│    ├─ Load testing                                                     │
│    ├─ Security testing                                                 │
│    └─ Approval required for production                                 │
│    ▼                                                                   │
│  Production Deployment (Blue-Green)                                    │
│    ├─ Deploy to new infrastructure (Green)                             │
│    ├─ Run health checks                                                │
│    ├─ Run smoke tests                                                  │
│    ├─ Switch traffic (Blue → Green)                                    │
│    ├─ Monitor metrics                                                  │
│    └─ Rollback if issues detected                                      │
│    ▼                                                                   │
│  Production (Live)                                                     │
│    ├─ Users access application                                         │
│    ├─ Metrics collected                                                │
│    ├─ Logs aggregated                                                  │
│    └─ Alerts on anomalies                                              │
│    ▼                                                                   │
│  Monitoring & Observability                                            │
│    ├─ Prometheus scrapes metrics                                       │
│    ├─ ELK aggregates logs                                              │
│    ├─ Sentry tracks errors                                             │
│    ├─ Grafana visualizes data                                          │
│    └─ Alerts trigger on thresholds                                     │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY PLAN                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Backup Strategy                                                        │
│  ├─ Database                                                           │
│  │  ├─ Daily snapshots to S3                                           │
│  │  ├─ Point-in-time recovery                                          │
│  │  ├─ Cross-region replication                                        │
│  │  └─ 30-day retention policy                                         │
│  │                                                                     │
│  ├─ Application Code                                                   │
│  │  ├─ Git repository (GitHub)                                         │
│  │  ├─ Docker images (Docker Hub)                                      │
│  │  └─ Artifact storage                                                │
│  │                                                                     │
│  └─ Configuration                                                      │
│     ├─ IaC version control (Terraform)                                 │
│     ├─ K8s manifests backup                                            │
│     └─ Secrets encrypted & backed up                                   │
│                                                                         │
│  Recovery Procedures                                                    │
│  ├─ RTO (Recovery Time Objective): < 1 hour                            │
│  ├─ RPO (Recovery Point Objective): < 15 minutes                       │
│  ├─ Failover to standby region                                         │
│  ├─ Database restore from backup                                       │
│  ├─ Application redeployment                                           │
│  └─ Health check & verification                                        │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. DEVOPS TOOLS & TECHNOLOGIES

### **CI/CD Pipeline Tools**

- **GitHub Actions** - Workflow automation
- **Jenkins** (alternative) - Self-hosted CI/CD
- **GitLab CI** (alternative) - Built-in CI/CD
- **CircleCI** (alternative) - Cloud-based CI/CD

### **Container & Orchestration**

- **Docker** - Container runtime
- **Docker Compose** - Local orchestration
- **Kubernetes** - Production orchestration
- **Docker Registry** - Image storage & distribution

### **Infrastructure as Code**

- **Terraform** - Cloud infrastructure
- **CloudFormation** - AWS infrastructure
- **Ansible** - Configuration management
- **Helm** - Kubernetes package manager

### **Monitoring & Logging**

- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **ELK Stack** - Centralized logging
- **Datadog** - Full observability
- **Sentry** - Error tracking
- **New Relic** - APM solution

### **Security & Scanning**

- **Snyk** - Dependency vulnerability scanning
- **Trivy** - Container image scanning
- **SonarQube** - Code quality & security
- **GitHub Security** - Built-in security scanning

### **Cloud Platforms Supported**

- **Railway** (Current primary)
- **Render** (Alternative)
- **AWS** (Enterprise-grade)
- **Google Cloud Platform** (GCP)
- **Microsoft Azure**
- **DigitalOcean** (Budget option)

### **Database as a Service**

- **AWS RDS** - Managed PostgreSQL
- **Railway PostgreSQL** - Managed database
- **Render PostgreSQL** - Managed database
- **Heroku PostgreSQL** - Managed database

### **Cache & Message Queue**

- **AWS ElastiCache** - Managed Redis
- **Railway Redis** - Managed Redis
- **RabbitMQ** - Message broker
- **Apache Kafka** - Event streaming

### **Load Balancing & CDN**

- **AWS ALB/NLB** - Application/Network Load Balancer
- **CloudFront** - AWS CDN
- **Cloudflare** - DNS & CDN
- **Nginx** - Reverse proxy

---

## 9. PRODUCTION DEPLOYMENT CHECKLIST

```
PRE-DEPLOYMENT
└─ ✓ Code review completed
   ✓ All tests passing (unit, integration, E2E)
   ✓ Code coverage > 80%
   ✓ No security vulnerabilities
   ✓ Documentation updated
   ✓ Database migrations tested
   ✓ Rollback plan prepared
   ✓ Stakeholder approval received

DEPLOYMENT
└─ ✓ Create deployment ticket
   ✓ Notify team in Slack
   ✓ Tag release in Git
   ✓ Build Docker images
   ✓ Run smoke tests in staging
   ✓ Perform load testing
   ✓ Execute blue-green deployment
   ✓ Verify application health
   ✓ Monitor error rates

POST-DEPLOYMENT
└─ ✓ Check all metrics normal
   ✓ Verify database integrity
   ✓ Test critical user flows
   ✓ Monitor performance
   ✓ Check email notifications
   ✓ Review logs for errors
   ✓ Update status page
   ✓ Document any issues
   ✓ Schedule retrospective (if issues)
```

---

**Architecture Version:** 2.0 (with Cloud & DevOps)  
**Last Updated:** December 14, 2025  
**Status:** Production Ready with DevOps Pipeline
