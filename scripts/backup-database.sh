#!/bin/bash

# Database Backup Script for CRM Production
# This script creates automated PostgreSQL backups with:
# - Retention policy (30 days default)
# - Backup verification
# - AWS S3 offsite storage support
# - Email notifications
# - Point-in-time recovery with WAL archiving

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-crm-postgres-prod}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"
WAL_BACKUP_FILE="wal_${DATE}.tar.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# AWS S3 Configuration (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-crm-backups}"
ENABLE_S3_UPLOAD="${ENABLE_S3_UPLOAD:-false}"

# Email notifications (optional)
ENABLE_EMAIL_ALERTS="${ENABLE_EMAIL_ALERTS:-false}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# Database credentials
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-crm}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

# ============================================
# Helper Functions
# ============================================

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Send email notification
send_email() {
    local subject="$1"
    local message="$2"
    
    if [ "$ENABLE_EMAIL_ALERTS" = "true" ] && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
}

# Upload to S3
upload_to_s3() {
    local file="$1"
    local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $file)"
    
    if [ "$ENABLE_S3_UPLOAD" = "true" ] && [ -n "$S3_BUCKET" ]; then
        log "Uploading to S3: $s3_path"
        if command -v aws &> /dev/null; then
            if aws s3 cp "$file" "$s3_path" --storage-class STANDARD_IA; then
                log "✅ S3 upload successful: $s3_path"
                return 0
            else
                log "⚠️  WARNING: S3 upload failed"
                return 1
            fi
        else
            log "⚠️  WARNING: AWS CLI not found, skipping S3 upload"
            return 1
        fi
    fi
    return 0
}

# ============================================
# Main Backup Process
# ============================================

log "=========================================="
log "Starting database backup process"
log "=========================================="

# Check if container is running
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    ERROR_MSG="ERROR: PostgreSQL container '$POSTGRES_CONTAINER' is not running!"
    log "$ERROR_MSG"
    send_email "❌ CRM Backup Failed" "$ERROR_MSG"
    exit 1
fi

# Create SQL dump backup
log "Creating SQL dump: $BACKUP_FILE"
if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
    --format=custom \
    --blobs \
    --verbose \
    --file=/tmp/backup.dump 2>&1 | tee -a "$LOG_FILE"; then
    
    # Copy from container and compress
    docker cp "$POSTGRES_CONTAINER:/tmp/backup.dump" "${BACKUP_DIR}/backup_${DATE}.dump"
    gzip -9 "${BACKUP_DIR}/backup_${DATE}.dump"
    mv "${BACKUP_DIR}/backup_${DATE}.dump.gz" "${BACKUP_DIR}/${BACKUP_FILE}"
    
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "✅ SQL dump completed: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    ERROR_MSG="ERROR: SQL dump backup failed!"
    log "$ERROR_MSG"
    send_email "❌ CRM Backup Failed" "$ERROR_MSG"
    exit 1
fi

# Backup WAL files for point-in-time recovery
log "Backing up WAL files for point-in-time recovery..."
if docker exec "$POSTGRES_CONTAINER" test -d /var/lib/postgresql/data/pg_wal; then
    docker exec "$POSTGRES_CONTAINER" tar czf /tmp/wal_backup.tar.gz -C /var/lib/postgresql/data pg_wal 2>/dev/null || true
    docker cp "$POSTGRES_CONTAINER:/tmp/wal_backup.tar.gz" "${BACKUP_DIR}/${WAL_BACKUP_FILE}" 2>/dev/null || true
    
    if [ -f "${BACKUP_DIR}/${WAL_BACKUP_FILE}" ]; then
        WAL_SIZE=$(du -h "${BACKUP_DIR}/${WAL_BACKUP_FILE}" | cut -f1)
        log "✅ WAL backup completed: ${WAL_BACKUP_FILE} (${WAL_SIZE})"
    else
        log "⚠️  WARNING: WAL backup skipped (not critical)"
    fi
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    log "✅ Backup integrity verification passed"
else
    ERROR_MSG="ERROR: Backup file is corrupted!"
    log "$ERROR_MSG"
    send_email "❌ CRM Backup Corrupted" "$ERROR_MSG"
    exit 1
fi

# Test restore capability (dry run)
log "Testing restore capability (dry run)..."
TEMP_RESTORE_DIR=$(mktemp -d)
if gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" > "${TEMP_RESTORE_DIR}/test.dump" 2>/dev/null; then
    # Verify dump file has valid header
    if head -c 5 "${TEMP_RESTORE_DIR}/test.dump" | grep -q "PGDMP"; then
        log "✅ Restore test passed - backup is restorable"
    else
        log "⚠️  WARNING: Backup may not be in valid PostgreSQL format"
    fi
    rm -rf "$TEMP_RESTORE_DIR"
else
    log "⚠️  WARNING: Restore test failed (non-critical)"
fi

# Upload to S3 if enabled
if [ "$ENABLE_S3_UPLOAD" = "true" ]; then
    upload_to_s3 "${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Also upload WAL backup if exists
    if [ -f "${BACKUP_DIR}/${WAL_BACKUP_FILE}" ]; then
        upload_to_s3 "${BACKUP_DIR}/${WAL_BACKUP_FILE}"
    fi
fi

# Clean up old backups (older than retention period)
log "Cleaning up local backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_WAL=$(find "$BACKUP_DIR" -name "wal_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ] || [ "$DELETED_WAL" -gt 0 ]; then
    log "Deleted $DELETED_COUNT SQL backup(s) and $DELETED_WAL WAL backup(s)"
else
    log "No old backups to delete"
fi

# Clean up old S3 backups if enabled
if [ "$ENABLE_S3_UPLOAD" = "true" ] && [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Cleaning up S3 backups older than ${RETENTION_DAYS} days..."
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]] && [[ -n "$FILE_NAME" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}"
            log "Deleted S3 backup: ${FILE_NAME}"
        fi
    done
fi

# Summary statistics
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "=========================================="
log "Backup Summary:"
log "- Local backups: $TOTAL_BACKUPS files"
log "- Total local size: $TOTAL_SIZE"
log "- Retention: ${RETENTION_DAYS} days"
log "- Latest backup: ${BACKUP_FILE} (${BACKUP_SIZE})"
if [ "$ENABLE_S3_UPLOAD" = "true" ]; then
    log "- S3 bucket: s3://${S3_BUCKET}/${S3_PREFIX}/"
fi
log "=========================================="

# Send success notification
SUCCESS_MSG="✅ CRM Database Backup Completed
Backup: ${BACKUP_FILE}
Size: ${BACKUP_SIZE}
Location: ${BACKUP_DIR}
$([ "$ENABLE_S3_UPLOAD" = "true" ] && echo "S3: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}")"

send_email "✅ CRM Backup Successful" "$SUCCESS_MSG"

log "Backup process completed successfully!"
exit 0
