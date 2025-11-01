-- CreateIndex
CREATE INDEX "deals_companyId_priority_idx" ON "deals"("companyId", "priority");

-- CreateIndex
CREATE INDEX "deals_companyId_leadScore_idx" ON "deals"("companyId", "leadScore");

-- CreateIndex
CREATE INDEX "deals_expectedCloseDate_idx" ON "deals"("expectedCloseDate");

-- CreateIndex
CREATE INDEX "deals_companyId_stage_priority_idx" ON "deals"("companyId", "stage", "priority");
