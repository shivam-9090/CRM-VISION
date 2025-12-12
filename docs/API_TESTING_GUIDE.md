# AI Employee Management System - API Testing Guide

## Base URL

```
http://localhost:3001/api
```

## Authentication

All endpoints require JWT token. Get token from login endpoint first:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Set the token as a variable:

```bash
export TOKEN="your_jwt_token_here"
```

---

## 📋 Tasks Module API Tests

### 1. Create a Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login authentication bug",
    "description": "Users cannot login with Google OAuth. Need to fix the callback URL handling.",
    "type": "DEVELOPMENT",
    "priority": "HIGH",
    "estimatedHours": 8,
    "dueDate": "2025-12-20T17:00:00Z",
    "companyId": "YOUR_COMPANY_ID"
  }'
```

### 2. Get All Tasks (with filters)

```bash
# All tasks
curl -X GET "http://localhost:3001/api/tasks?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl -X GET "http://localhost:3001/api/tasks?status=IN_PROGRESS" \
  -H "Authorization: Bearer $TOKEN"

# Filter by assigned user
curl -X GET "http://localhost:3001/api/tasks?assignedToId=USER_ID" \
  -H "Authorization: Bearer $TOKEN"

# Filter by priority and type
curl -X GET "http://localhost:3001/api/tasks?priority=HIGH&type=DEVELOPMENT" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Task by ID

```bash
curl -X GET http://localhost:3001/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Task

```bash
curl -X PUT http://localhost:3001/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug - Updated",
    "priority": "URGENT",
    "estimatedHours": 6
  }'
```

### 5. Assign Task to Employee

```bash
curl -X POST http://localhost:3001/api/tasks/TASK_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedToId": "EMPLOYEE_USER_ID"
  }'
```

### 6. Start Task (Employee action)

```bash
curl -X POST http://localhost:3001/api/tasks/TASK_ID/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Starting work on this task"
  }'
```

### 7. Complete Task (Employee action)

```bash
curl -X POST http://localhost:3001/api/tasks/TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualHours": 5.5,
    "notes": "Task completed successfully. Fixed OAuth callback handling."
  }'
```

### 8. Update Task Status

```bash
curl -X PUT http://localhost:3001/api/tasks/TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "BLOCKED",
    "notes": "Waiting for API team to fix endpoint",
    "hoursSpent": 2.0
  }'
```

### 9. Get Task History

```bash
curl -X GET http://localhost:3001/api/tasks/TASK_ID/history \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Delete Task

```bash
curl -X DELETE http://localhost:3001/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Employee Performance API Tests

### 1. Get All Employees with Performance Metrics

```bash
# All employees
curl -X GET http://localhost:3001/api/employees \
  -H "Authorization: Bearer $TOKEN"

# Filter by company
curl -X GET "http://localhost:3001/api/employees?companyId=COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
[
  {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    "performanceScore": 87.5,
    "skillTags": ["React", "TypeScript", "Node.js"],
    "workCapacity": 5,
    "currentWorkload": 2,
    "totalTasksCompleted": 45,
    "totalTasksAssigned": 50,
    "onTimeCompletionRate": 91.5,
    "averageCompletionTime": 6.2,
    "utilizationRate": 40,
    "completionRate": 90
  }
]
```

### 2. Get Leaderboard (Top Performers)

```bash
curl -X GET "http://localhost:3001/api/employees/leaderboard?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Employee Performance Details

```bash
curl -X GET http://localhost:3001/api/employees/EMPLOYEE_ID/performance \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "employee": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "EMPLOYEE",
    "skillTags": ["React", "TypeScript"]
  },
  "performance": {
    "totalScore": 87.5,
    "breakdown": {
      "completionRate": {
        "value": 90,
        "weight": 30,
        "contribution": 27,
        "description": "45 of 50 tasks completed"
      },
      "onTimeRate": {
        "value": 91.5,
        "weight": 25,
        "contribution": 22.875,
        "description": "91.5% delivered on time"
      },
      "averageSpeed": {
        "value": 85,
        "weight": 20,
        "contribution": 17,
        "description": "Average 6.2 hours per task"
      },
      "taskQuality": {
        "value": 88,
        "weight": 15,
        "contribution": 13.2,
        "description": "Quality score from 5 recent reviews"
      },
      "workloadBalance": {
        "value": 70,
        "weight": 10,
        "contribution": 7,
        "description": "2 of 5 capacity used"
      }
    },
    "stats": {
      "totalTasksAssigned": 50,
      "totalTasksCompleted": 45,
      "currentWorkload": 2,
      "workCapacity": 5,
      "onTimeCompletionRate": 91.5,
      "averageCompletionTime": 6.2
    }
  },
  "recentTasks": [...],
  "reviews": [...]
}
```

### 4. Get Employee Task History

```bash
curl -X GET "http://localhost:3001/api/employees/EMPLOYEE_ID/tasks?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Create Performance Review

```bash
curl -X POST http://localhost:3001/api/employees/EMPLOYEE_ID/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "EMPLOYEE_ID",
    "reviewPeriodStart": "2025-10-01T00:00:00Z",
    "reviewPeriodEnd": "2025-12-31T23:59:59Z",
    "qualityScore": 8.5,
    "reviewNotes": "Excellent performance this quarter. Delivered all tasks on time.",
    "strengths": ["fast_delivery", "quality_work", "team_player"],
    "improvements": ["communication", "documentation"]
  }'
```

### 6. Update Employee Skills

```bash
curl -X PUT http://localhost:3001/api/employees/EMPLOYEE_ID/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillTags": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
  }'
```

### 7. Update Work Capacity

```bash
curl -X PUT http://localhost:3001/api/employees/EMPLOYEE_ID/capacity \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workCapacity": 7
  }'
```

### 8. Manually Recalculate Performance Score

```bash
curl -X POST http://localhost:3001/api/employees/EMPLOYEE_ID/recalculate-score \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🤖 AI Work Assignment API Tests

### 1. Get AI Suggestions for Task

```bash
curl -X POST http://localhost:3001/api/work-assignment/suggest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TASK_ID",
    "requiredSkills": ["React", "TypeScript", "Bug Fixing"]
  }'
```

**Expected Response:**

```json
[
  {
    "employeeId": "user_123",
    "employeeName": "John Doe",
    "employeeEmail": "john@example.com",
    "confidenceScore": 0.92,
    "estimatedCompletion": 6.5,
    "reasoning": {
      "performanceScore": 87.5,
      "currentWorkload": 2,
      "workCapacity": 5,
      "skillMatch": 100,
      "pastExperience": 8,
      "onTimeRate": 91.5,
      "factors": [
        "High performance score",
        "Low workload - Available",
        "Excellent skill match",
        "Extensive experience with similar tasks",
        "Excellent on-time delivery rate"
      ]
    }
  },
  {
    "employeeId": "user_456",
    "employeeName": "Jane Smith",
    "employeeEmail": "jane@example.com",
    "confidenceScore": 0.85,
    "estimatedCompletion": 7.0,
    "reasoning": {
      "performanceScore": 92.0,
      "currentWorkload": 4,
      "workCapacity": 5,
      "skillMatch": 66,
      "pastExperience": 5,
      "onTimeRate": 95.0,
      "factors": [
        "High performance score",
        "Moderate workload",
        "Good skill match",
        "Extensive experience with similar tasks",
        "Excellent on-time delivery rate"
      ]
    }
  }
]
```

### 2. Auto-Assign Task (AI selects best employee)

```bash
curl -X POST http://localhost:3001/api/work-assignment/auto-assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TASK_ID",
    "requiredSkills": ["React", "TypeScript"]
  }'
```

### 3. Get All Pending Suggestions

```bash
# All pending suggestions
curl -X GET http://localhost:3001/api/work-assignment/suggestions \
  -H "Authorization: Bearer $TOKEN"

# Filter by company
curl -X GET "http://localhost:3001/api/work-assignment/suggestions?companyId=COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Suggestions for Specific Task

```bash
curl -X GET http://localhost:3001/api/work-assignment/tasks/TASK_ID/suggestions \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Accept AI Suggestion

```bash
curl -X POST http://localhost:3001/api/work-assignment/accept \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestionId": "SUGGESTION_ID"
  }'
```

### 6. Reject AI Suggestion

```bash
curl -X POST http://localhost:3001/api/work-assignment/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestionId": "SUGGESTION_ID",
    "reason": "Employee is on vacation this week"
  }'
```

---

## 🧪 Testing Workflow

### Complete Test Scenario:

1. **Create a new task**

```bash
TASK_ID=$(curl -s -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user dashboard",
    "description": "Create a React dashboard with charts and analytics",
    "type": "DEVELOPMENT",
    "priority": "HIGH",
    "estimatedHours": 12,
    "companyId": "COMPANY_ID"
  }' | jq -r '.id')

echo "Created task: $TASK_ID"
```

2. **Get AI suggestions for the task**

```bash
curl -X POST http://localhost:3001/api/work-assignment/suggest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"requiredSkills\": [\"React\", \"TypeScript\", \"Charts\"]
  }" | jq
```

3. **Auto-assign to best employee**

```bash
curl -X POST http://localhost:3001/api/work-assignment/auto-assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"taskId\": \"$TASK_ID\",
    \"requiredSkills\": [\"React\", \"TypeScript\"]
  }" | jq
```

4. **Employee starts the task**

```bash
curl -X POST http://localhost:3001/api/tasks/$TASK_ID/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Starting work on dashboard"}' | jq
```

5. **Check employee performance**

```bash
curl -X GET http://localhost:3001/api/employees/EMPLOYEE_ID/performance \
  -H "Authorization: Bearer $TOKEN" | jq
```

6. **Complete the task**

```bash
curl -X POST http://localhost:3001/api/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualHours": 10.5,
    "notes": "Dashboard completed with all features"
  }' | jq
```

7. **Verify score was updated**

```bash
curl -X GET http://localhost:3001/api/employees/EMPLOYEE_ID/performance \
  -H "Authorization: Bearer $TOKEN" | jq '.performance.totalScore'
```

---

## 📊 API Endpoints Summary

### Tasks Module (12 endpoints)

- POST `/api/tasks` - Create task
- GET `/api/tasks` - List tasks (with filters)
- GET `/api/tasks/:id` - Get task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task
- POST `/api/tasks/:id/assign` - Assign task
- POST `/api/tasks/:id/start` - Start task
- POST `/api/tasks/:id/complete` - Complete task
- PUT `/api/tasks/:id/status` - Update status
- GET `/api/tasks/:id/history` - Get history

### Employee Performance (8 endpoints)

- GET `/api/employees` - List employees
- GET `/api/employees/leaderboard` - Top performers
- GET `/api/employees/:id/performance` - Performance details
- GET `/api/employees/:id/tasks` - Task history
- POST `/api/employees/:id/review` - Create review
- PUT `/api/employees/:id/skills` - Update skills
- PUT `/api/employees/:id/capacity` - Update capacity
- POST `/api/employees/:id/recalculate-score` - Recalculate score

### Work Assignment (6 endpoints)

- POST `/api/work-assignment/suggest` - Get AI suggestions
- POST `/api/work-assignment/auto-assign` - Auto-assign task
- GET `/api/work-assignment/suggestions` - List pending suggestions
- GET `/api/work-assignment/tasks/:id/suggestions` - Task suggestions
- POST `/api/work-assignment/accept` - Accept suggestion
- POST `/api/work-assignment/reject` - Reject suggestion

**Total: 26 new API endpoints** 🎉

---

## 🔍 Verification Checklist

- [ ] Create task successfully
- [ ] Get AI suggestions with confidence scores
- [ ] Auto-assign assigns to highest confidence employee
- [ ] Task status transitions work (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
- [ ] Employee workload updates automatically
- [ ] Performance score recalculates after task completion
- [ ] Task history tracks all changes
- [ ] Skill matching works correctly
- [ ] Leaderboard shows top performers
- [ ] Performance breakdown shows correct calculations
