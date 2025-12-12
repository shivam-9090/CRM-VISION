-- AlterTable: Add employee performance fields to User
ALTER TABLE "users" ADD COLUMN "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0;
ALTER TABLE "users" ADD COLUMN "skillTags" JSONB;
ALTER TABLE "users" ADD COLUMN "workCapacity" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "users" ADD COLUMN "averageCompletionTime" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "totalTasksAssigned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "onTimeCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "users" ADD COLUMN "currentWorkload" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum: TaskType
CREATE TYPE "TaskType" AS ENUM ('GENERAL', 'DEVELOPMENT', 'DESIGN', 'SALES', 'MARKETING', 'SUPPORT', 'RESEARCH');

-- CreateEnum: TaskStatus
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateTable: Task
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'GENERAL',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "difficultyScore" DOUBLE PRECISION,
    "aiSuggestedUserId" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "companyId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TaskHistory
CREATE TABLE "task_history" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "TaskStatus",
    "newStatus" "TaskStatus",
    "hoursSpent" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkSuggestion
CREATE TABLE "work_suggestions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "suggestedUserId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reasoning" JSONB NOT NULL,
    "estimatedCompletion" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PerformanceReview
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewPeriodStart" TIMESTAMP(3) NOT NULL,
    "reviewPeriodEnd" TIMESTAMP(3) NOT NULL,
    "tasksCompleted" INTEGER NOT NULL,
    "averageCompletionTime" DOUBLE PRECISION NOT NULL,
    "onTimeRate" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "performanceScore" DOUBLE PRECISION NOT NULL,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "strengths" JSONB,
    "improvements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TaskAttachment
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");
CREATE INDEX "tasks_assignedById_idx" ON "tasks"("assignedById");
CREATE INDEX "tasks_companyId_idx" ON "tasks"("companyId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_companyId_status_assignedToId_idx" ON "tasks"("companyId", "status", "assignedToId");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "task_history_taskId_idx" ON "task_history"("taskId");
CREATE INDEX "task_history_userId_idx" ON "task_history"("userId");
CREATE INDEX "task_history_createdAt_idx" ON "task_history"("createdAt");

-- CreateIndex
CREATE INDEX "work_suggestions_suggestedUserId_idx" ON "work_suggestions"("suggestedUserId");
CREATE INDEX "work_suggestions_taskId_idx" ON "work_suggestions"("taskId");
CREATE INDEX "work_suggestions_status_idx" ON "work_suggestions"("status");
CREATE INDEX "work_suggestions_createdAt_idx" ON "work_suggestions"("createdAt");

-- CreateIndex
CREATE INDEX "performance_reviews_userId_idx" ON "performance_reviews"("userId");
CREATE INDEX "performance_reviews_reviewPeriodStart_reviewPeriodEnd_idx" ON "performance_reviews"("reviewPeriodStart", "reviewPeriodEnd");

-- CreateIndex
CREATE INDEX "task_attachments_taskId_idx" ON "task_attachments"("taskId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_suggestions" ADD CONSTRAINT "work_suggestions_suggestedUserId_fkey" FOREIGN KEY ("suggestedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
