/*
  Warnings:

  - You are about to drop the column `address` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `deals` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `deals` table. All the data in the column will be lost.
  - You are about to drop the column `probability` on the `deals` table. All the data in the column will be lost.
  - Made the column `contactId` on table `deals` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TASK', 'CALL', 'MEETING', 'EMAIL', 'NOTE');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deals" DROP CONSTRAINT "deals_companyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deals" DROP CONSTRAINT "deals_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."deals" DROP CONSTRAINT "deals_ownerId_fkey";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "industry",
DROP COLUMN "phone",
DROP COLUMN "size",
DROP COLUMN "website",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "position";

-- AlterTable
ALTER TABLE "deals" DROP COLUMN "description",
DROP COLUMN "ownerId",
DROP COLUMN "probability",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ALTER COLUMN "value" DROP NOT NULL,
ALTER COLUMN "value" DROP DEFAULT,
ALTER COLUMN "expectedCloseDate" DROP NOT NULL,
ALTER COLUMN "contactId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL DEFAULT 'TASK',
    "status" "ActivityStatus" NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
