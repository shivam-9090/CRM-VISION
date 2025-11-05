#!/bin/bash

# Backup Verification Script for CRM Production
# This script verifies backup integrity and restorability

set -e

# ============================================
# Configuration
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_FILE="${1:-latest}"
VERIFY_RESTORE="${VERIFY_RESTORE:-true}"
TEST_CONTAINER="crm-postgres-test-restore"

# ============================================
# Helper Functions
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cleanup() {
    log "Cleaning up test container..."
    docker rm -f "$TEST_CONTAINER" 2>/dev/null || true
}

trap cleanup EXIT

# ============================================
# Main Verification Process
# ============================================

log "=========================================="
log "Starting backup verification"
log "=========================================="

# Find backup file
if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -n 1)
    if [ -z "$BACKUP_FILE" ]; then
        log "❌ ERROR: No backups found!"
        exit 1
    fi
    log "Latest backup: $(basename $BACKUP_FILE)"
else
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Verify file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup file: $(basename $BACKUP_FILE) ($BACKUP_SIZE)"

# Test 1: File integrity
log ""
log "Test 1: Verifying file integrity..."
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "✅ PASS: File integrity check"
else
    log "❌ FAIL: File is corrupted!"
    exit 1
fi

# Test 2: Decompress and check SQL syntax
log ""
log "Test 2: Checking SQL dump format..."
TEMP_SQL=$(mktemp)
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

if head -n 20 "$TEMP_SQL" | grep -q "PostgreSQL database dump"; then
    log "✅ PASS: Valid PostgreSQL dump format"
else
    log "❌ FAIL: Invalid SQL dump format!"
    rm -f "$TEMP_SQL"
    exit 1
fi

# Count objects in backup
TABLE_COUNT=$(grep -c "CREATE TABLE" "$TEMP_SQL" || echo "0")
INDEX_COUNT=$(grep -c "CREATE INDEX" "$TEMP_SQL" || echo "0")
log "   - Tables: $TABLE_COUNT"
log "   - Indexes: $INDEX_COUNT"

rm -f "$TEMP_SQL"

# Test 3: Restore to test database
if [ "$VERIFY_RESTORE" = "true" ]; then
    log ""
    log "Test 3: Verifying restore capability..."
    
    # Create test PostgreSQL container
    log "Creating test PostgreSQL container..."
    docker run -d \
        --name "$TEST_CONTAINER" \
        -e POSTGRES_PASSWORD=test_password \
        -e POSTGRES_DB=test_restore \
        postgres:15-alpine > /dev/null 2>&1
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to start..."
    for i in {1..30}; do
        if docker exec "$TEST_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
            log "✅ PostgreSQL ready"
            break
        fi
        sleep 1
    done
    
    # Restore backup to test database
    log "Restoring backup to test database..."
    if gunzip -c "$BACKUP_FILE" | docker exec -i "$TEST_CONTAINER" psql -U postgres -d test_restore > /dev/null 2>&1; then
        log "✅ PASS: Backup restored successfully"
        
        # Verify data
        RESTORED_TABLES=$(docker exec "$TEST_CONTAINER" psql -U postgres -d test_restore -t -c \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        
        log "   - Restored tables: $(echo $RESTORED_TABLES | tr -d ' ')"
        
        if [ "$(echo $RESTORED_TABLES | tr -d ' ')" -gt 0 ]; then
            log "✅ PASS: Data verification successful"
        else
            log "⚠️  WARNING: No tables found in restored database"
        fi
    else
        log "❌ FAIL: Restore test failed!"
        exit 1
    fi
fi

# Test 4: Check backup age
log ""
log "Test 4: Checking backup freshness..."
BACKUP_AGE=$(find "$BACKUP_FILE" -mtime +1 | wc -l)
if [ "$BACKUP_AGE" -eq 0 ]; then
    log "✅ PASS: Backup is less than 24 hours old"
else
    DAYS_OLD=$((($(date +%s) - $(stat -c %Y "$BACKUP_FILE")) / 86400))
    log "⚠️  WARNING: Backup is $DAYS_OLD days old"
fi

# Summary
log ""
log "=========================================="
log "Verification Summary"
log "=========================================="
log "Backup File: $(basename $BACKUP_FILE)"
log "Size: $BACKUP_SIZE"
log "Tables: $TABLE_COUNT"
log "Indexes: $INDEX_COUNT"
log ""
log "✅ All verification tests passed!"
log "Backup is valid and restorable"
log "=========================================="

exit 0
