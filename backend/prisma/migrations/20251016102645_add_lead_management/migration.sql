-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'FACEBOOK', 'GOOGLE_ADS', 'LINKEDIN', 'REFERRAL', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'TRADE_SHOW', 'SOCIAL_MEDIA', 'DIRECT_MAIL', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "leadScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leadSource" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
