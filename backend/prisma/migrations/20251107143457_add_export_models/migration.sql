/*
  Warnings:

  - You are about to drop the column `search_vector` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `deals` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."notification_preferences" DROP CONSTRAINT "notification_preferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."push_subscriptions" DROP CONSTRAINT "push_subscriptions_userId_fkey";

-- DropIndex
DROP INDEX "public"."activities_search_idx";

-- DropIndex
DROP INDEX "public"."companies_search_idx";

-- DropIndex
DROP INDEX "public"."contacts_search_idx";

-- DropIndex
DROP INDEX "public"."deals_search_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "deals" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "export_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "filters" JSONB,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "schedule" TEXT,
    "filters" JSONB,
    "fields" JSONB,
    "templateId" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "totalRecords" INTEGER,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_templates_companyId_idx" ON "export_templates"("companyId");

-- CreateIndex
CREATE INDEX "export_templates_userId_idx" ON "export_templates"("userId");

-- CreateIndex
CREATE INDEX "export_jobs_companyId_idx" ON "export_jobs"("companyId");

-- CreateIndex
CREATE INDEX "export_jobs_userId_idx" ON "export_jobs"("userId");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "export_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
