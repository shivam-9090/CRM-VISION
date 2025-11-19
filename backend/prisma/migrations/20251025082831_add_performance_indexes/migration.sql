-- CreateIndex
CREATE INDEX "activities_companyId_idx" ON "activities"("companyId");

-- CreateIndex
CREATE INDEX "activities_companyId_scheduledDate_idx" ON "activities"("companyId", "scheduledDate");

-- CreateIndex
CREATE INDEX "activities_companyId_status_idx" ON "activities"("companyId", "status");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_companyId_email_idx" ON "contacts"("companyId", "email");

-- CreateIndex
CREATE INDEX "deals_companyId_idx" ON "deals"("companyId");

-- CreateIndex
CREATE INDEX "deals_companyId_stage_idx" ON "deals"("companyId", "stage");

-- CreateIndex
CREATE INDEX "deals_assignedToId_idx" ON "deals"("assignedToId");

-- CreateIndex
CREATE INDEX "deals_contactId_idx" ON "deals"("contactId");
