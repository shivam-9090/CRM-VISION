#!/bin/bash

# Setup automated backups with cron job
# Run this script once to configure daily backups at 2 AM

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"  # Default: 2 AM daily

echo "Setting up automated database backups..."

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo "✅ Made backup script executable"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "backup-database.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $BACKUP_SCRIPT >> /var/log/crm-backup.log 2>&1") | crontab -
echo "✅ Added cron job: $CRON_SCHEDULE"

# Display current crontab
echo ""
echo "Current cron jobs:"
crontab -l

echo ""
echo "✅ Setup complete! Backups will run daily at 2 AM"
echo ""
echo "To test the backup manually, run:"
echo "  $BACKUP_SCRIPT"
echo ""
echo "To view backup logs:"
echo "  tail -f /var/log/crm-backup.log"
