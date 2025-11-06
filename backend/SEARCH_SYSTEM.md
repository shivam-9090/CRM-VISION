# Search System Documentation

## Overview

The CRM system uses **PostgreSQL Full-Text Search (FTS)** for high-performance search across contacts, deals, companies, and activities. This provides 10-100x performance improvement over the previous ILIKE-based search while maintaining simplicity and integration with the existing database.

## Architecture

### Previous Implementation (ILIKE-based)
```typescript
// ❌ SLOW - Sequential scan on every search
where: {
  OR: [
    { firstName: { contains: query, mode: 'insensitive' } },
    { lastName: { contains: query, mode: 'insensitive' } },
  ]
}
```

**Problems:**
- No indexing support for case-insensitive pattern matching
- Sequential scan (O(n)) for every search
- Poor performance with large datasets (10K+ records)
- Relevance scoring done in application layer
- CPU-intensive for complex queries

### Current Implementation (PostgreSQL FTS)
```typescript
// ✅ FAST - Uses GIN index with tsvector
SELECT id, firstName, lastName, email, phone,
  ts_rank(search_vector, to_tsquery('english', ${query})) as rank
FROM contacts
WHERE search_vector @@ to_tsquery('english', ${query})
  AND companyId = ${companyId}
ORDER BY rank DESC
LIMIT ${limit}
```

**Advantages:**
- **GIN indexes** provide 10-100x faster searches
- **Weighted text search** (A=primary, B=important, C=secondary)
- **Automatic maintenance** via database triggers
- **Database-level relevance scoring** with `ts_rank()`
- **Stemming and stop words** with 'english' dictionary
- **Prefix matching** for autocomplete (`term:*`)

## Database Schema

### Search Vector Columns
Each searchable table has a `search_vector` column with type `tsvector`:

```sql
-- Contacts table
ALTER TABLE "contacts" ADD COLUMN "search_vector" tsvector;
CREATE INDEX "contacts_search_idx" ON "contacts" USING GIN ("search_vector");

-- Automatic update trigger
CREATE FUNCTION contacts_search_vector_update() RETURNS trigger AS $$
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
```

### Weight Strategy

| Weight | Priority | Use Case | Examples |
|--------|----------|----------|----------|
| A | Highest | Primary identifiers | firstName, lastName, title, name |
| B | High | Important fields | email, description, notes |
| C | Medium | Secondary metadata | phone, stage, type, priority |
| D | Low | Additional context | website, industry, tags |

### Indexed Tables

1. **Contacts** (193 records populated)
   - Weight A: firstName, lastName
   - Weight B: email
   - Weight C: phone

2. **Deals** (45 records populated)
   - Weight A: title
   - Weight B: stage
   - Weight C: notes

3. **Companies** (80 records populated)
   - Weight A: name
   - Weight B: description

4. **Activities** (2 records populated)
   - Weight A: title
   - Weight B: description
   - Weight C: type

## API Endpoints

### Global Search
```http
GET /api/search?query={searchTerm}&types={types}&limit={limit}
```

**Query Parameters:**
- `query` (required): Search term (min 2 characters for suggestions)
- `types` (optional): Array of entity types: `contact`, `deal`, `company`, `activity`
- `limit` (optional): Results per entity type (default: 10, max: 100)

**Response:**
```json
{
  "results": [
    {
      "type": "contact",
      "id": "clx123",
      "title": "John Smith",
      "subtitle": "john@example.com",
      "description": "+1234567890",
      "metadata": {
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "relevance": 0.456789
    }
  ]
}
```

### Entity-Specific Search
```http
GET /api/search/contacts?query={searchTerm}&limit={limit}
GET /api/search/deals?query={searchTerm}&limit={limit}
GET /api/search/companies?query={searchTerm}&limit={limit}
GET /api/search/activities?query={searchTerm}&limit={limit}
```

### Autocomplete Suggestions
```http
GET /api/search/suggestions?query={searchTerm}
```

Returns top 5 results across all entity types for quick autocomplete.

## Query Syntax

### Basic Search
```
John Smith          → Searches for records containing both "John" AND "Smith"
sales pipeline      → Searches for "sales" AND "pipeline"
```

### Prefix Matching (Autocomplete)
```
joh:*               → Matches "John", "Johnson", "Johan"
sales:*             → Matches "sales", "salesman", "salesforce"
```

All queries automatically use prefix matching internally:
```typescript
const tsQuery = query.split(/\s+/)
  .map(term => `${term}:*`)  // Add prefix matching
  .join(' & ');              // Combine with AND
```

### Advanced Features (Coming Soon)

#### Phrase Search
```
"John Smith"        → Exact phrase matching
```

#### Boolean Operators
```
John & Smith        → AND (both required)
John | Smith        → OR (either match)
John & !Smith       → NOT (exclude Smith)
```

#### Fuzzy Matching (Requires pg_trgm extension)
```
Jhn Smth            → Matches "John Smith" with typos
```

## Performance Characteristics

### GIN Index Benefits
- **Index Scan**: O(log n) instead of O(n) sequential scan
- **Concurrent Queries**: Multiple searches don't block each other
- **Disk I/O**: Only reads index pages, not full table
- **Memory Efficient**: Index fits in PostgreSQL shared_buffers

### Expected Performance
| Dataset Size | ILIKE (old) | FTS (new) | Speedup |
|--------------|-------------|-----------|---------|
| 1K records   | 20-50ms     | 2-5ms     | 10x     |
| 10K records  | 200-500ms   | 5-15ms    | 40x     |
| 100K records | 2-5s        | 10-30ms   | 100x    |
| 1M records   | 20-50s      | 20-50ms   | 1000x   |

### Benchmarking
Use `EXPLAIN ANALYZE` to verify index usage:

```sql
EXPLAIN ANALYZE
SELECT id, firstName, lastName,
  ts_rank(search_vector, to_tsquery('english', 'john:*')) as rank
FROM contacts
WHERE search_vector @@ to_tsquery('english', 'john:*')
ORDER BY rank DESC
LIMIT 10;
```

**Look for:**
- ✅ `Bitmap Index Scan on contacts_search_idx`
- ✅ `Recheck Cond: (search_vector @@ to_tsquery(...))`
- ❌ `Seq Scan on contacts` (indicates index not used)

## Maintenance

### Index Rebuilding
If search performance degrades over time:

```sql
-- Reindex GIN indexes
REINDEX INDEX contacts_search_idx;
REINDEX INDEX deals_search_idx;
REINDEX INDEX companies_search_idx;
REINDEX INDEX activities_search_idx;

-- Or reindex all at once
REINDEX TABLE contacts;
REINDEX TABLE deals;
REINDEX TABLE companies;
REINDEX TABLE activities;
```

### Update Statistics
Keep query planner statistics current:

```sql
ANALYZE contacts;
ANALYZE deals;
ANALYZE companies;
ANALYZE activities;
```

Run after bulk imports or major data changes.

### Vacuum
Reclaim space from deleted records:

```sql
VACUUM ANALYZE contacts;
VACUUM ANALYZE deals;
VACUUM ANALYZE companies;
VACUUM ANALYZE activities;
```

### Manual Search Vector Update
If triggers fail or are disabled:

```sql
-- Manually rebuild search_vector for all contacts
UPDATE contacts
SET search_vector = 
  setweight(to_tsvector('english', coalesce("firstName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("lastName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(phone, '')), 'C');
```

### Monitoring Index Health

```sql
-- Check index size
SELECT pg_size_pretty(pg_relation_size('contacts_search_idx')) as index_size;

-- Check bloat
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE tablename IN ('contacts', 'deals', 'companies', 'activities');
```

## Security

### Company Scoping
All searches are scoped to user's company:

```sql
WHERE search_vector @@ to_tsquery(...)
  AND "companyId" = ${companyId}  -- ← Multi-tenant isolation
```

### Permissions
Search endpoints require appropriate permissions:

```typescript
@Permissions(PERMISSIONS.SEARCH_GLOBAL)
@Get()
async globalSearch() { ... }

@Permissions(PERMISSIONS.SEARCH_CONTACTS)
@Get('/contacts')
async searchContacts() { ... }
```

### SQL Injection Protection
Using Prisma's `$queryRaw` with parameterized queries:

```typescript
// ✅ SAFE - Parameters are escaped
await prisma.$queryRaw`
  SELECT * FROM contacts
  WHERE search_vector @@ to_tsquery('english', ${tsQuery})
`;

// ❌ UNSAFE - Never use raw string interpolation
await prisma.$queryRawUnsafe(`SELECT * FROM contacts WHERE ...${query}...`);
```

## Future Enhancements

### 1. Search Analytics (Task 19, Todo 6)
```sql
CREATE TABLE search_logs (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX search_logs_query_idx ON search_logs(query);
CREATE INDEX search_logs_company_idx ON search_logs(company_id, created_at);
```

**Metrics to track:**
- Popular searches (most frequent queries)
- Zero-result searches (queries with no results)
- Slow searches (response time > 100ms)
- Search trends (queries over time)

### 2. Redis Caching
```typescript
// Cache popular searches for 5 minutes
const cacheKey = `search:${companyId}:${query}:${types.join(',')}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const results = await performSearch(...);
await redis.setex(cacheKey, 300, JSON.stringify(results));
return results;
```

### 3. Result Highlighting
```sql
SELECT id, title,
  ts_headline('english', title, to_tsquery('english', 'sales:*')) as highlighted_title
FROM deals
WHERE search_vector @@ to_tsquery('english', 'sales:*');

-- Result: "Acme Corp <b>Sales</b> Pipeline"
```

### 4. Fuzzy Matching (Typo Tolerance)
```sql
-- Requires pg_trgm extension
CREATE EXTENSION pg_trgm;

-- Create trigram index for fuzzy matching
CREATE INDEX contacts_name_trgm_idx ON contacts USING GIN (
  ("firstName" || ' ' || "lastName") gin_trgm_ops
);

-- Search with typos
SELECT * FROM contacts
WHERE similarity("firstName" || ' ' || "lastName", 'Jhn Smth') > 0.3
ORDER BY similarity("firstName" || ' ' || "lastName", 'Jhn Smth') DESC;
```

### 5. Multi-Language Support
```sql
-- Currently: 'english' dictionary only
to_tsvector('english', text)

-- Future: Dynamic language selection
to_tsvector(user_language::regconfig, text)

-- Supported languages: english, spanish, french, german, italian, etc.
```

### 6. Advanced Filters
```typescript
// Filter by date range
WHERE search_vector @@ to_tsquery(...)
  AND created_at BETWEEN ${startDate} AND ${endDate}

// Filter by status/stage
WHERE search_vector @@ to_tsquery(...)
  AND stage = 'QUALIFIED'

// Filter by assigned user
WHERE search_vector @@ to_tsquery(...)
  AND assigned_to_id = ${userId}
```

### 7. Saved Searches
```sql
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Migration to Elasticsearch

If search requirements exceed PostgreSQL FTS capabilities (e.g., > 100GB data, multi-language, complex analytics):

### When to Consider Elasticsearch
- Dataset size > 100GB
- Need for advanced NLP features
- Cross-language search requirements
- Complex aggregations and faceting
- High concurrency (> 1000 searches/sec)

### Migration Strategy
1. **Parallel Setup**: Run PostgreSQL FTS and Elasticsearch simultaneously
2. **Data Sync**: Use Logstash or custom workers to sync data
3. **A/B Testing**: Compare performance and relevance
4. **Gradual Rollout**: Switch entity types one at a time
5. **Fallback**: Keep PostgreSQL FTS as backup

### Elasticsearch Configuration
```json
{
  "mappings": {
    "properties": {
      "firstName": { "type": "text", "boost": 2.0 },
      "lastName": { "type": "text", "boost": 2.0 },
      "email": { "type": "text", "boost": 1.5 },
      "phone": { "type": "keyword" },
      "companyId": { "type": "keyword" }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "edge_ngram"]
        }
      }
    }
  }
}
```

## Troubleshooting

### Issue: Search returns no results
**Check:**
```sql
-- Verify search_vector is populated
SELECT id, search_vector FROM contacts LIMIT 5;

-- If NULL, rebuild:
UPDATE contacts SET updated_at = NOW();  -- Trigger will update search_vector
```

### Issue: Slow queries
**Check:**
```sql
EXPLAIN ANALYZE SELECT ... ;

-- Look for:
-- ❌ Seq Scan (index not used)
-- ✅ Bitmap Index Scan (index used)
```

**Fix:**
```sql
-- Rebuild statistics
ANALYZE contacts;

-- Rebuild index
REINDEX INDEX contacts_search_idx;
```

### Issue: Index bloat
**Check:**
```sql
SELECT pg_size_pretty(pg_relation_size('contacts_search_idx'));
```

**Fix:**
```sql
REINDEX INDEX CONCURRENTLY contacts_search_idx;  -- No downtime
```

### Issue: Relevance scoring inaccurate
**Adjust weights:**
```sql
-- Make email more important than phone
setweight(to_tsvector('english', coalesce(email, '')), 'A')  -- Was 'B'
setweight(to_tsvector('english', coalesce(phone, '')), 'D')  -- Was 'C'
```

## References

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- [Text Search Functions](https://www.postgresql.org/docs/current/functions-textsearch.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Prisma Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)

---

**Last Updated**: Task 19 - Advanced Search Optimization  
**Migration Applied**: 20251106075500_add_fulltext_search  
**Status**: ✅ Production Ready
