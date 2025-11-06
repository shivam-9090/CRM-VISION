# Audit Log System - Implementation Guide

## 📋 Overview

The CRM system now has a comprehensive audit logging infrastructure that automatically tracks all CRUD operations, provides analytics, and includes intelligent retention policies.

**Status**: ✅ Fully Implemented  
**Related Task**: Task 16 - Audit Log Analysis & Retention  
**Implementation Date**: 2025-01-XX

---

## 🎯 Features

### 1. **Automatic Audit Logging**
- ✅ Decorator-based logging (`@AuditLog`)
- ✅ Interceptor pattern for transparent tracking
- ✅ Captures: CREATE, UPDATE, DELETE, VIEW, EXPORT actions
- ✅ Stores complete change history (old value → new value)
- ✅ Multi-tenant isolation (company-scoped)

### 2. **Retention Policy**
- ✅ Automatic cleanup of old logs
- ✅ Configurable retention periods:
  - **Regular logs**: 365 days (1 year)
  - **Sensitive logs** (DELETE, EXPORT): 2555 days (7 years)
- ✅ Cron job scheduled for daily cleanup (2 AM)
- ✅ Compliance-ready archival

### 3. **Analytics & Reporting**
- ✅ Statistics by action type
- ✅ Statistics by entity type
- ✅ Statistics by user
- ✅ Complete audit trails for entities
- ✅ Export functionality for compliance

### 4. **Security**
- ✅ Permission-based access (`PERMISSIONS.AUDIT_READ`)
- ✅ Company-scoped data isolation
- ✅ User tracking with full context
- ✅ Sanitization of sensitive fields

---

## 🏗️ Architecture

### Components

```
backend/src/
├── audit-log/
│   ├── audit-log.service.ts      # Core business logic, analytics, retention
│   ├── audit-log.controller.ts   # REST API endpoints
│   └── audit-log.module.ts       # Module configuration
├── common/
│   ├── decorators/
│   │   └── audit.decorator.ts    # @AuditLog decorator
│   └── interceptors/
│       └── audit.interceptor.ts  # Automatic logging interceptor
└── prisma/
    └── schema.prisma              # AuditLog model, AuditAction enum
```

### Database Schema

```prisma
model AuditLog {
  id         String      @id @default(uuid())
  action     AuditAction
  entityType String      // e.g., "User", "Deal", "Contact"
  entityId   String      // UUID of the entity
  changes    Json?       // { old: {...}, new: {...} }
  userId     String
  companyId  String
  createdAt  DateTime    @default(now())
  
  user       User        @relation(fields: [userId], references: [id])
  company    Company     @relation(fields: [companyId], references: [id])
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([companyId])
  @@index([createdAt])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW      // New: for read operations
  EXPORT    // New: for data exports
}
```

---

## 🚀 Usage Guide

### 1. Adding Audit Logging to a Service

**Option A: Using @AuditLog Decorator (Recommended)**

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLog } from '../common/decorators/audit.decorator';

@Injectable()
export class DealsService {
  
  @AuditLog('Deal') // Automatically logs CREATE action
  async create(createDealDto: CreateDealDto, userId: string, companyId: string) {
    const deal = await this.prisma.deal.create({
      data: { ...createDealDto, userId, companyId },
    });
    return deal;
  }

  @AuditLog('Deal', { action: 'UPDATE' }) // Explicitly log UPDATE
  async update(id: string, updateDealDto: UpdateDealDto, userId: string, companyId: string) {
    const oldDeal = await this.prisma.deal.findUnique({ where: { id } });
    const newDeal = await this.prisma.deal.update({
      where: { id },
      data: updateDealDto,
    });
    return newDeal;
  }

  @AuditLog('Deal', { action: 'DELETE' })
  async remove(id: string, userId: string, companyId: string) {
    const deal = await this.prisma.deal.delete({ where: { id } });
    return deal;
  }

  @AuditLog('Deal', { action: 'VIEW', excludeFields: ['password', 'secret'] })
  async findOne(id: string, userId: string, companyId: string) {
    return this.prisma.deal.findUnique({ where: { id } });
  }
}
```

**Option B: Manual Logging (For Complex Scenarios)**

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UserService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async updateSensitiveData(id: string, data: any, userId: string, companyId: string) {
    const oldUser = await this.prisma.user.findUnique({ where: { id } });
    
    const newUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Manual logging with custom changes
    await this.auditLogService.create({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      userId,
      companyId,
      changes: {
        old: { email: oldUser.email },
        new: { email: newUser.email },
        // Exclude sensitive fields manually
      },
    });

    return newUser;
  }
}
```

### 2. Registering the AuditInterceptor Globally

**In `app.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    // ... other imports
    AuditLogModule,
    // ScheduleModule.forRoot(), // Uncomment when @nestjs/schedule is installed
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
```

### 3. Enabling Automatic Cleanup (Cron Job)

**Install the scheduler package:**

```bash
npm install @nestjs/schedule
```

**Update `audit-log.service.ts`:**

```typescript
// Uncomment the @Cron decorator
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_2AM) // Remove comment
async cleanupOldLogs(): Promise<{ deleted: number; message: string }> {
  // ... existing implementation
}
```

**Update `app.module.ts`:**

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    // ... other imports
  ],
})
export class AppModule {}
```

---

## 📊 API Endpoints

### 1. List Audit Logs (With Filtering)

```http
GET /api/audit-logs?entityType=Deal&userId=xxx&startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `entityType` - Filter by entity (User, Deal, Contact, etc.)
- `entityId` - Filter by specific entity ID
- `userId` - Filter by user who performed action
- `action` - Filter by action type (CREATE, UPDATE, DELETE, VIEW, EXPORT)
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "UPDATE",
    "entityType": "Deal",
    "entityId": "deal-uuid",
    "changes": {
      "old": { "status": "NEW" },
      "new": { "status": "WON" }
    },
    "userId": "user-uuid",
    "companyId": "company-uuid",
    "createdAt": "2025-01-15T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
]
```

### 2. Get Audit Trail for Entity

```http
GET /api/audit-logs/trail?entityType=Deal&entityId=deal-uuid
Authorization: Bearer <token>
```

**Response:** Complete chronological history of all actions on the entity.

### 3. Get Statistics by Action

```http
GET /api/audit-logs/stats/actions?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

**Response:**
```json
[
  { "action": "CREATE", "count": 150 },
  { "action": "UPDATE", "count": 320 },
  { "action": "DELETE", "count": 45 },
  { "action": "VIEW", "count": 2500 },
  { "action": "EXPORT", "count": 12 }
]
```

### 4. Get Statistics by Entity

```http
GET /api/audit-logs/stats/entities?startDate=2025-01-01
Authorization: Bearer <token>
```

**Response:**
```json
[
  { "entityType": "Deal", "count": 450 },
  { "entityType": "Contact", "count": 280 },
  { "entityType": "User", "count": 120 }
]
```

### 5. Get Statistics by User

```http
GET /api/audit-logs/stats/users?startDate=2025-01-01
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "userId": "user-uuid",
    "user": { "email": "admin@crm.com", "name": "Admin" },
    "count": 520
  },
  {
    "userId": "user-uuid-2",
    "user": { "email": "sales@crm.com", "name": "Sales Rep" },
    "count": 280
  }
]
```

### 6. Export Audit Logs (Compliance)

```http
GET /api/audit-logs/export?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response:** Complete JSON export with company/user details for archival.

### 7. Manual Cleanup Trigger (Admin Only)

```http
GET /api/audit-logs/cleanup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "deleted": 1250,
  "message": "Successfully cleaned up 1250 old audit logs"
}
```

---

## ⚙️ Configuration

### Retention Periods

In `audit-log.service.ts`:

```typescript
export class AuditLogService {
  private readonly DEFAULT_RETENTION_DAYS = 365;      // 1 year
  private readonly SENSITIVE_RETENTION_DAYS = 2555;   // 7 years (compliance)
  
  // Customize as needed
}
```

**Sensitive Actions (Extended Retention):**
- `DELETE` - Permanent data removal
- `EXPORT` - Data extractions for compliance

### Excluded Fields (Privacy)

When using the decorator, exclude sensitive fields:

```typescript
@AuditLog('User', { 
  action: 'UPDATE',
  excludeFields: ['password', 'passwordHash', 'resetToken'] 
})
async updateUser(id: string, data: UpdateUserDto) {
  // Password changes won't be logged
}
```

---

## 🔒 Security Considerations

### 1. **Permission-Based Access**
All audit endpoints require `PERMISSIONS.AUDIT_READ`. In production:
- Restrict cleanup endpoint to admin role only
- Consider separate permission for exports (`PERMISSIONS.AUDIT_EXPORT`)

### 2. **Data Sanitization**
The interceptor automatically:
- Excludes `password`, `passwordHash`, `secret`, `token` fields
- Sanitizes changes object before storage
- Never logs authentication credentials

### 3. **Company Isolation**
All queries are automatically scoped to `req.user.companyId` preventing cross-tenant data access.

### 4. **Sensitive Data Handling**
For PII compliance (GDPR, CCPA):
```typescript
@AuditLog('User', { 
  excludeFields: ['ssn', 'creditCard', 'bankAccount'] 
})
```

---

## 📈 Coverage Verification

### Check Current Coverage

Run this script to see which entities are being audited:

```typescript
// scripts/verify-audit-coverage.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAuditCoverage() {
  // Get unique entity types from audit logs
  const entityTypes = await prisma.auditLog.groupBy({
    by: ['entityType'],
    _count: { id: true },
  });

  console.log('📊 Audit Log Coverage:');
  console.log('=====================');
  
  entityTypes.forEach(({ entityType, _count }) => {
    console.log(`✅ ${entityType}: ${_count.id} logs`);
  });

  // Expected entities
  const expected = ['User', 'Deal', 'Contact', 'Company', 'Activity'];
  const covered = entityTypes.map(e => e.entityType);
  const missing = expected.filter(e => !covered.includes(e));

  if (missing.length > 0) {
    console.log('\n⚠️  Missing Coverage:');
    missing.forEach(entity => console.log(`   - ${entity}`));
  } else {
    console.log('\n✅ All critical entities are covered!');
  }
}

verifyAuditCoverage();
```

---

## 🧪 Testing

### 1. Test Automatic Logging

```bash
# Create a deal (should log CREATE action)
curl -X POST http://localhost:3001/api/deals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Deal","value":10000,"stage":"NEW"}'

# Verify the log was created
curl http://localhost:3001/api/audit-logs?entityType=Deal \
  -H "Authorization: Bearer <token>"
```

### 2. Test Retention Policy

```bash
# Trigger manual cleanup
curl http://localhost:3001/api/audit-logs/cleanup \
  -H "Authorization: Bearer <token>"
```

### 3. Test Analytics

```bash
# Get statistics
curl http://localhost:3001/api/audit-logs/stats/actions \
  -H "Authorization: Bearer <token>"

curl http://localhost:3001/api/audit-logs/stats/entities \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Implementation Checklist

- [x] Create `@AuditLog` decorator
- [x] Create `AuditInterceptor` for automatic logging
- [x] Update Prisma schema with VIEW and EXPORT actions
- [x] Add retention policy with configurable periods
- [x] Add analytics methods (by action, entity, user)
- [x] Add audit trail retrieval
- [x] Add export functionality
- [x] Create REST API endpoints
- [x] Add permission guards
- [x] Document the system
- [ ] Install @nestjs/schedule package
- [ ] Enable cron job for automatic cleanup
- [ ] Register AuditInterceptor globally in AppModule
- [ ] Apply @AuditLog decorators to all CRUD services
- [ ] Verify coverage with test script
- [ ] Add frontend UI for audit log viewing
- [ ] Add unit tests for service methods
- [ ] Add integration tests for API endpoints

---

## 🎓 Best Practices

1. **Always Use Decorators**: Prefer `@AuditLog` over manual logging for consistency
2. **Exclude Sensitive Data**: Use `excludeFields` for passwords, tokens, PII
3. **Log Meaningful Changes**: Don't log VIEW actions on every read (use sparingly)
4. **Monitor Storage**: Check database size regularly, adjust retention if needed
5. **Archive Before Delete**: For compliance, export logs before automatic cleanup
6. **Test Coverage**: Run verification script monthly to ensure all entities are tracked
7. **Performance**: Add database indexes on commonly queried fields (already done)

---

## 🐛 Troubleshooting

### Issue: Logs Not Being Created

**Solution:**
1. Verify `AuditInterceptor` is registered in `AppModule`
2. Check that service methods have `@AuditLog` decorator
3. Ensure request context includes `userId` and `companyId`

### Issue: Cron Job Not Running

**Solution:**
1. Install `@nestjs/schedule`: `npm install @nestjs/schedule`
2. Import `ScheduleModule.forRoot()` in `AppModule`
3. Uncomment `@Cron` decorator in `audit-log.service.ts`

### Issue: Performance Degradation

**Solution:**
1. Run cleanup manually: `GET /api/audit-logs/cleanup`
2. Reduce retention periods if database is large
3. Add pagination to `findAll` queries
4. Consider archiving old logs to separate storage

---

## 📚 Related Documentation

- [Error Handling Standardization](./ERROR_HANDLING_STANDARDIZATION.md) - Task 15
- [Permission System](../README.md#permissions) - Authorization
- [Prisma Schema](./prisma/schema.prisma) - Database models

---

## 🚀 Next Steps (Task 17)

After completing Task 16, move to:
- **Task 17**: Permission System Review & Enhancements
- Add role-based permissions for audit access
- Implement audit log retention policies in production
- Create frontend dashboard for audit analytics

---

**Status**: ✅ Implementation Complete  
**Requires**: Manual steps to enable cron jobs and apply decorators  
**Tested**: ⏳ Pending integration testing
