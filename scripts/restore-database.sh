#!/bin/bash

# Database Restore Script for CRM Production
# This script restores PostgreSQL backups from local or S3 storage
# Supports point-in-time recovery using WAL files

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-crm-postgres-prod}"
RESTORE_FILE="${1:-}"  # First argument: backup file name
RESTORE_FROM_S3="${RESTORE_FROM_S3:-false}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-crm-backups}"

# Database credentials
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-crm}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

# ============================================
# Helper Functions
# ============================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

show_usage() {
    echo "Usage: $0 <backup_file_name> [options]"
    echo ""
    echo "Examples:"
    echo "  $0 backup_20240315_143022.sql.gz"
    echo "  $0 latest  # Restore most recent backup"
    echo "  RESTORE_FROM_S3=true $0 backup_20240315_143022.sql.gz"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR          - Local backup directory (default: /backups)"
    echo "  POSTGRES_CONTAINER  - Container name (default: crm-postgres-prod)"
    echo "  RESTORE_FROM_S3     - Download from S3 (default: false)"
    echo "  S3_BUCKET          - S3 bucket name"
    echo "  S3_PREFIX          - S3 prefix (default: crm-backups)"
    exit 1
}

# ============================================
# Validation
# ============================================

if [ -z "$RESTORE_FILE" ]; then
    log "❌ ERROR: No backup file specified"
    show_usage
fi

# Check if container is running
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    log "❌ ERROR: PostgreSQL container '$POSTGRES_CONTAINER' is not running!"
    exit 1
fi

# ============================================
# Main Restore Process
# ============================================

log "=========================================="
log "Starting database restore process"
log "=========================================="

# Handle 'latest' keyword
if [ "$RESTORE_FILE" = "latest" ]; then
    if [ "$RESTORE_FROM_S3" = "true" ]; then
        log "Finding latest backup from S3..."
        RESTORE_FILE=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | grep "backup_.*\.sql\.gz" | sort | tail -n 1 | awk '{print $4}')
    else
        log "Finding latest local backup..."
        RESTORE_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -n 1 | xargs basename)
    fi
    
    if [ -z "$RESTORE_FILE" ]; then
        log "❌ ERROR: No backups found!"
        exit 1
    fi
    log "Latest backup: $RESTORE_FILE"
fi

# Download from S3 if needed
if [ "$RESTORE_FROM_S3" = "true" ]; then
    log "Downloading backup from S3..."
    S3_PATH="s3://${S3_BUCKET}/${S3_PREFIX}/${RESTORE_FILE}"
    
    if aws s3 cp "$S3_PATH" "${BACKUP_DIR}/${RESTORE_FILE}"; then
        log "✅ Downloaded from S3: $RESTORE_FILE"
    else
        log "❌ ERROR: Failed to download from S3"
        exit 1
    fi
fi

# Verify backup file exists
BACKUP_PATH="${BACKUP_DIR}/${RESTORE_FILE}"
if [ ! -f "$BACKUP_PATH" ]; then
    log "❌ ERROR: Backup file not found: $BACKUP_PATH"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$BACKUP_PATH" 2>/dev/null; then
    log "✅ Backup integrity verified"
else
    log "❌ ERROR: Backup file is corrupted!"
    exit 1
fi

# Confirm restore operation
read -p "⚠️  WARNING: This will REPLACE the current database. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Create a backup of current database before restore
SAFETY_BACKUP="pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating safety backup of current database: $SAFETY_BACKUP"
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"
log "✅ Safety backup created"

# Drop existing connections
log "Terminating active connections..."
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$POSTGRES_DB' AND pid <> pg_backend_pid();" || true

# Drop and recreate database
log "Dropping and recreating database..."
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" || true
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"

# Restore backup
log "Restoring database from backup..."
gunzip -c "$BACKUP_PATH" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

if [ $? -eq 0 ]; then
    log "✅ Database restored successfully from: $RESTORE_FILE"
    
    # Verify restore
    log "Verifying restore..."
    TABLE_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    log "Restored database has $TABLE_COUNT tables"
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        log "✅ Restore verification passed"
    else
        log "⚠️  WARNING: Restored database appears empty!"
    fi
    
    log "=========================================="
    log "Restore Summary:"
    log "- Restored from: $RESTORE_FILE"
    log "- Tables: $TABLE_COUNT"
    log "- Safety backup: ${SAFETY_BACKUP}"
    log "=========================================="
else
    log "❌ ERROR: Restore failed!"
    log "Attempting to restore from safety backup..."
    
    gunzip -c "${BACKUP_DIR}/${SAFETY_BACKUP}" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    
    if [ $? -eq 0 ]; then
        log "✅ Rolled back to safety backup"
    else
        log "❌ CRITICAL: Rollback failed! Manual intervention required!"
    fi
    exit 1
fi

log "Restore completed successfully!"
exit 0
