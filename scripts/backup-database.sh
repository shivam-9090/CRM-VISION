#!/bin/bash

# Database Backup Script for CRM Production
# This script creates automated PostgreSQL backups with retention policy

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-crm-postgres-prod}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting database backup..."

# Check if container is running
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    log "ERROR: PostgreSQL container '$POSTGRES_CONTAINER' is not running!"
    exit 1
fi

# Get database credentials from environment
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-crm}"

# Create backup
log "Creating backup: $BACKUP_FILE"
if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "✅ Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "❌ ERROR: Backup failed!"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    log "✅ Backup verification passed"
else
    log "❌ ERROR: Backup file is corrupted!"
    exit 1
fi

# Clean up old backups (older than retention period)
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List current backups
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Current backups: $TOTAL_BACKUPS files, Total size: $TOTAL_SIZE"

log "Backup process completed successfully!"
exit 0
