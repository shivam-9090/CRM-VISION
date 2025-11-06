-- ============================================
-- Full-Text Search Migration
-- Adds PostgreSQL Full-Text Search to CRM entities
-- Based on actual schema: contacts, deals, companies, activities
-- ============================================

-- ============================================
-- 1. CONTACTS TABLE - Full-Text Search
-- ============================================

-- Add search_vector column to contacts
ALTER TABLE "contacts" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search on contacts
CREATE INDEX "contacts_search_idx" ON "contacts" USING GIN ("search_vector");

-- Create function to automatically update search_vector for contacts
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

-- Create trigger to update search_vector on insert/update
CREATE TRIGGER contacts_search_vector_trigger
BEFORE INSERT OR UPDATE ON "contacts"
FOR EACH ROW EXECUTE FUNCTION contacts_search_vector_update();

-- Populate existing contacts
UPDATE "contacts"
SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("lastName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(phone, '')), 'C');

-- ============================================
-- 2. DEALS TABLE - Full-Text Search
-- ============================================

-- Add search_vector column to deals
ALTER TABLE "deals" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search on deals
CREATE INDEX "deals_search_idx" ON "deals" USING GIN ("search_vector");

-- Create function to automatically update search_vector for deals
-- Note: stage is an enum, notes field exists (description does not)
CREATE OR REPLACE FUNCTION deals_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.stage::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search_vector on insert/update
CREATE TRIGGER deals_search_vector_trigger
BEFORE INSERT OR UPDATE ON "deals"
FOR EACH ROW EXECUTE FUNCTION deals_search_vector_update();

-- Populate existing deals
UPDATE "deals"
SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(stage::text, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(notes, '')), 'C');

-- ============================================
-- 3. COMPANIES TABLE - Full-Text Search
-- ============================================

-- Add search_vector column to companies
ALTER TABLE "companies" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search on companies
CREATE INDEX "companies_search_idx" ON "companies" USING GIN ("search_vector");

-- Create function to automatically update search_vector for companies
-- Note: Only name and description fields exist (no industry/website in schema)
CREATE OR REPLACE FUNCTION companies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search_vector on insert/update
CREATE TRIGGER companies_search_vector_trigger
BEFORE INSERT OR UPDATE ON "companies"
FOR EACH ROW EXECUTE FUNCTION companies_search_vector_update();

-- Populate existing companies
UPDATE "companies"
SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');

-- ============================================
-- 4. ACTIVITIES TABLE - Full-Text Search
-- ============================================

-- Add search_vector column to activities
ALTER TABLE "activities" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search on activities
CREATE INDEX "activities_search_idx" ON "activities" USING GIN ("search_vector");

-- Create function to automatically update search_vector for activities
-- Note: type is an enum (ActivityType), cast to text for tsvector
CREATE OR REPLACE FUNCTION activities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.type::text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search_vector on insert/update
CREATE TRIGGER activities_search_vector_trigger
BEFORE INSERT OR UPDATE ON "activities"
FOR EACH ROW EXECUTE FUNCTION activities_search_vector_update();

-- Populate existing activities
UPDATE "activities"
SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(type::text, '')), 'C');
