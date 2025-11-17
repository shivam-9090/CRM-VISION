-- Fix all search triggers - Drop and recreate with correct schema
-- This fixes "The column `new` does not exist" errors

-- ============================================
-- CONTACTS TABLE - Fix Search Trigger
-- ============================================

DROP TRIGGER IF EXISTS contacts_search_vector_trigger ON "contacts";
DROP FUNCTION IF EXISTS contacts_search_vector_update();
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "contacts" ADD COLUMN "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "contacts_search_idx" ON "contacts" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION contacts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW."firstName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."lastName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.phone, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_vector_trigger
BEFORE INSERT OR UPDATE ON "contacts"
FOR EACH ROW EXECUTE FUNCTION contacts_search_vector_update();

UPDATE "contacts" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("lastName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(phone, '')), 'C');

-- ============================================
-- DEALS TABLE - Fix Search Trigger
-- ============================================

DROP TRIGGER IF EXISTS deals_search_vector_trigger ON "deals";
DROP FUNCTION IF EXISTS deals_search_vector_update();
ALTER TABLE "deals" DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "deals" ADD COLUMN "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "deals_search_idx" ON "deals" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION deals_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.stage::text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_search_vector_trigger
BEFORE INSERT OR UPDATE ON "deals"
FOR EACH ROW EXECUTE FUNCTION deals_search_vector_update();

UPDATE "deals" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(notes, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(stage::text, '')), 'C');

-- ============================================
-- COMPANIES TABLE - Already fixed in previous migration
-- ============================================
-- Skip companies as it was fixed in migration 20251117000000

-- ============================================
-- ACTIVITIES TABLE - Fix Search Trigger
-- ============================================

DROP TRIGGER IF EXISTS activities_search_vector_trigger ON "activities";
DROP FUNCTION IF EXISTS activities_search_vector_update();
ALTER TABLE "activities" DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "activities" ADD COLUMN "search_vector" tsvector;
CREATE INDEX IF NOT EXISTS "activities_search_idx" ON "activities" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION activities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.type::text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_search_vector_trigger
BEFORE INSERT OR UPDATE ON "activities"
FOR EACH ROW EXECUTE FUNCTION activities_search_vector_update();

UPDATE "activities" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(type::text, '')), 'C');
