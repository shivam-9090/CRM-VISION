-- Add Full-Text Search Support
-- This migration adds tsvector columns and GIN indexes for fast full-text search
-- Performance improvement: 10-100x faster than ILIKE queries on large datasets

-- ============================================
-- CONTACTS TABLE - Full-Text Search
-- ============================================

-- Add tsvector column for search
ALTER TABLE "contacts" ADD COLUMN "search_vector" tsvector;

-- Create index for fast full-text search
CREATE INDEX "contacts_search_idx" ON "contacts" USING GIN ("search_vector");

-- Create function to update search_vector automatically
CREATE OR REPLACE FUNCTION contacts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW."firstName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."lastName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.phone, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.position, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search_vector on INSERT/UPDATE
CREATE TRIGGER contacts_search_vector_trigger
BEFORE INSERT OR UPDATE ON "contacts"
FOR EACH ROW EXECUTE FUNCTION contacts_search_vector_update();

-- Populate existing data
UPDATE "contacts" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("lastName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(phone, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(position, '')), 'D');

-- ============================================
-- DEALS TABLE - Full-Text Search
-- ============================================

ALTER TABLE "deals" ADD COLUMN "search_vector" tsvector;

CREATE INDEX "deals_search_idx" ON "deals" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION deals_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.stage, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_search_vector_trigger
BEFORE INSERT OR UPDATE ON "deals"
FOR EACH ROW EXECUTE FUNCTION deals_search_vector_update();

UPDATE "deals" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(stage, '')), 'C');

-- ============================================
-- COMPANIES TABLE - Full-Text Search
-- ============================================

ALTER TABLE "companies" ADD COLUMN "search_vector" tsvector;

CREATE INDEX "companies_search_idx" ON "companies" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION companies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.industry, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.website, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_search_vector_trigger
BEFORE INSERT OR UPDATE ON "companies"
FOR EACH ROW EXECUTE FUNCTION companies_search_vector_update();

UPDATE "companies" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(industry, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(website, '')), 'D');

-- ============================================
-- ACTIVITIES TABLE - Full-Text Search
-- ============================================

ALTER TABLE "activities" ADD COLUMN "search_vector" tsvector;

CREATE INDEX "activities_search_idx" ON "activities" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION activities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.type, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_search_vector_trigger
BEFORE INSERT OR UPDATE ON "activities"
FOR EACH ROW EXECUTE FUNCTION activities_search_vector_update();

UPDATE "activities" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(type, '')), 'C');

-- ============================================
-- PERFORMANCE NOTES
-- ============================================

-- Weights explanation:
-- A (highest weight) - Primary fields (name, title)
-- B (high weight) - Important descriptive fields (description, email)
-- C (medium weight) - Secondary fields (stage, type, industry)
-- D (low weight) - Additional fields (phone, website, position)

-- GIN indexes provide:
-- - 10-100x faster than ILIKE queries
-- - Automatic relevance ranking with ts_rank
-- - Support for phrase search, prefix matching
-- - Minimal overhead on writes (triggers update search_vector automatically)

-- Example query usage:
-- SELECT * FROM contacts WHERE search_vector @@ to_tsquery('english', 'john & smith');
-- SELECT *, ts_rank(search_vector, to_tsquery('english', 'john')) as rank
--   FROM contacts WHERE search_vector @@ to_tsquery('english', 'john')
--   ORDER BY rank DESC;
