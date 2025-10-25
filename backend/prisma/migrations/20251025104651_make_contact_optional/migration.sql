-- DropForeignKey
ALTER TABLE "public"."deals" DROP CONSTRAINT "deals_contactId_fkey";

-- AlterTable
ALTER TABLE "deals" ALTER COLUMN "contactId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
