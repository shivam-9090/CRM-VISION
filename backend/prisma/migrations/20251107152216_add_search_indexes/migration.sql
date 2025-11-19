-- CreateIndex
CREATE INDEX "activities_title_idx" ON "activities"("title");

-- CreateIndex
CREATE INDEX "activities_companyId_title_idx" ON "activities"("companyId", "title");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "contacts_firstName_idx" ON "contacts"("firstName");

-- CreateIndex
CREATE INDEX "contacts_lastName_idx" ON "contacts"("lastName");

-- CreateIndex
CREATE INDEX "contacts_companyId_firstName_lastName_idx" ON "contacts"("companyId", "firstName", "lastName");

-- CreateIndex
CREATE INDEX "users_companyId_email_idx" ON "users"("companyId", "email");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");
