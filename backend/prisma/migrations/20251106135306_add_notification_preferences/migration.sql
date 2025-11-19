-- CreateEnum for NotificationChannel (if needed)
-- NotificationChannel is used in NotificationPreference for type-specific preferences

-- ============================================
-- NOTIFICATION TABLE - Add New Fields
-- ============================================

-- Add new fields for enhanced notification features
ALTER TABLE "notifications" ADD COLUMN "isMuted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN "snoozedUntil" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN "groupKey" TEXT;
ALTER TABLE "notifications" ADD COLUMN "groupCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "notifications" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for new fields
CREATE INDEX "notifications_userId_groupKey_idx" ON "notifications"("userId", "groupKey");
CREATE INDEX "notifications_snoozedUntil_idx" ON "notifications"("snoozedUntil");

-- ============================================
-- NOTIFICATION_PREFERENCES TABLE - Create New Table
-- ============================================

CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Channel preferences
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    
    -- Type-specific preferences (JSON mapping NotificationType to channels)
    "typePreferences" JSONB NOT NULL DEFAULT '{}',
    
    -- Sound and visual preferences
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "soundType" TEXT NOT NULL DEFAULT 'default',
    
    -- Quiet hours (24-hour format)
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    
    -- Muted entities (JSON array of {entityType, entityId})
    "mutedEntities" JSONB NOT NULL DEFAULT '[]',
    
    -- Grouping preferences
    "groupingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "groupingWindow" INTEGER NOT NULL DEFAULT 300,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId (one preference set per user)
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- Add foreign key constraint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- PUSH_SUBSCRIPTIONS TABLE - Create New Table
-- ============================================

CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Create unique index on endpoint (each subscription is unique)
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- Create index on userId for efficient lookups
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- Add foreign key constraint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- This migration adds:
-- 1. Enhanced Notification fields:
--    - isMuted: Ability to mute individual notifications
--    - snoozedUntil: Snooze notifications until a specific time
--    - groupKey: Group similar notifications together
--    - groupCount: Track number of notifications in a group
--    - updatedAt: Track when notifications are modified

-- 2. NotificationPreference table:
--    - Per-user notification delivery preferences
--    - Control which channels (email, push, in-app) are enabled
--    - Type-specific preferences for fine-grained control
--    - Quiet hours to suppress notifications during sleep time
--    - Muted entities to ignore notifications from specific entities
--    - Grouping preferences to control notification batching

-- 3. PushSubscription table:
--    - Store browser push notification subscriptions (Web Push API)
--    - Support for multiple devices per user
--    - Encryption keys for secure push delivery
--    - User agent tracking for device identification

-- Performance considerations:
-- - Indexes added for efficient querying (userId + groupKey, snoozedUntil)
-- - JSONB used for flexible preference storage (typePreferences, mutedEntities, keys)
-- - Default values ensure backward compatibility

-- Security considerations:
-- - Foreign key constraints ensure referential integrity
-- - Unique constraint on userId prevents duplicate preferences
-- - Unique constraint on endpoint prevents duplicate push subscriptions
