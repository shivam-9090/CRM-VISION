-- CreateEnum for MeetingStatus
DO $$ BEGIN
 CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ReminderMethod
DO $$ BEGIN
 CREATE TYPE "ReminderMethod" AS ENUM ('EMAIL', 'POPUP', 'NOTIFICATION');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: google_calendar_tokens
CREATE TABLE IF NOT EXISTS "google_calendar_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "syncToken" TEXT,
    "channelId" TEXT,
    "resourceId" TEXT,
    "channelExpiry" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: meetings
CREATE TABLE IF NOT EXISTS "meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "organizerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "attendees" JSONB DEFAULT '[]',
    "googleEventId" TEXT,
    "googleCalendarId" TEXT DEFAULT 'primary',
    "googleMeetLink" TEXT,
    "isSyncedToGoogle" BOOLEAN NOT NULL DEFAULT false,
    "lastGoogleSync" TIMESTAMP(3),
    "reminders" JSONB DEFAULT '[{"minutes": 15, "method": "notification"}, {"minutes": 60, "method": "email"}]',
    "recurrence" JSONB,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "agenda" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: meeting_reminders
CREATE TABLE IF NOT EXISTS "meeting_reminders" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "method" "ReminderMethod" NOT NULL DEFAULT 'NOTIFICATION',
    "minutesBefore" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "google_calendar_tokens_userId_key" ON "google_calendar_tokens"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "google_calendar_tokens_userId_idx" ON "google_calendar_tokens"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "google_calendar_tokens_channelId_idx" ON "google_calendar_tokens"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "meetings_googleEventId_key" ON "meetings"("googleEventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_companyId_idx" ON "meetings"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_organizerId_idx" ON "meetings"("organizerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_dealId_idx" ON "meetings"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_contactId_idx" ON "meetings"("contactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_startTime_idx" ON "meetings"("startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_status_idx" ON "meetings"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_companyId_startTime_idx" ON "meetings"("companyId", "startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_organizerId_startTime_idx" ON "meetings"("organizerId", "startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meetings_googleEventId_idx" ON "meetings"("googleEventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meeting_reminders_meetingId_idx" ON "meeting_reminders"("meetingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "meeting_reminders_scheduledFor_sentAt_idx" ON "meeting_reminders"("scheduledFor", "sentAt");

-- AddForeignKey
ALTER TABLE "google_calendar_tokens" ADD CONSTRAINT "google_calendar_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_reminders" ADD CONSTRAINT "meeting_reminders_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
