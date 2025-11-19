-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "activities_assignedToId_idx" ON "activities"("assignedToId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
