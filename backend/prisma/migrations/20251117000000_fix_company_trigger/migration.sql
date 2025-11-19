-- Fix: Drop and recreate company search trigger with correct columns
-- This fixes the "column new does not exist" error

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS companies_search_vector_trigger ON "companies";
DROP FUNCTION IF EXISTS companies_search_vector_update();

-- Drop the search_vector column if it exists (will be recreated)
ALTER TABLE "companies" DROP COLUMN IF EXISTS "search_vector";

-- Re-add search_vector column
ALTER TABLE "companies" ADD COLUMN "search_vector" tsvector;

-- Create index for fast full-text search
CREATE INDEX IF NOT EXISTS "companies_search_idx" ON "companies" USING GIN ("search_vector");

-- Create function with correct column names (name and description only)
CREATE OR REPLACE FUNCTION companies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER companies_search_vector_trigger
BEFORE INSERT OR UPDATE ON "companies"
FOR EACH ROW EXECUTE FUNCTION companies_search_vector_update();

-- Populate existing data
UPDATE "companies" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');
