# 🔧 CRM Production Scripts

Automated maintenance scripts for production deployment.

---

## 📁 Scripts Overview

### 1. **backup-database.sh** (Linux/Mac)
Automated PostgreSQL backup with compression and retention.

**Features**:
- ✅ Compressed backups (gzip)
- ✅ 30-day retention policy
- ✅ Integrity verification
- ✅ Detailed logging
- ✅ Docker container support

**Usage**:
```bash
# Manual backup
./scripts/backup-database.sh

# Custom backup directory
BACKUP_DIR=/path/to/backups ./scripts/backup-database.sh

# Custom retention (60 days)
RETENTION_DAYS=60 ./scripts/backup-database.sh
```

**Environment Variables**:
- `BACKUP_DIR` - Backup directory (default: `/backups`)
- `RETENTION_DAYS` - Days to keep backups (default: `30`)
- `POSTGRES_CONTAINER` - Container name (default: `crm-postgres-prod`)
- `POSTGRES_USER` - Database user (default: `postgres`)
- `POSTGRES_DB` - Database name (default: `crm`)

---

### 2. **backup-database.ps1** (Windows PowerShell)
Windows equivalent of the backup script.

**Usage**:
```powershell
# Manual backup
.\scripts\backup-database.ps1

# Custom parameters
.\scripts\backup-database.ps1 -BackupDir "C:\Backups" -RetentionDays 60 -PostgresContainer "crm-postgres-prod"
```

**Parameters**:
- `-BackupDir` - Backup directory (default: `.\backups`)
- `-RetentionDays` - Days to keep backups (default: `30`)
- `-PostgresContainer` - Container name (default: `crm-postgres-prod`)

---

### 3. **setup-backup-cron.sh** (Linux/Mac)
One-time setup for automated daily backups.

**Usage**:
```bash
# Setup daily backups at 2 AM
./scripts/setup-backup-cron.sh

# Custom schedule (every 6 hours)
CRON_SCHEDULE="0 */6 * * *" ./scripts/setup-backup-cron.sh
```

**Cron Schedule Examples**:
- `0 2 * * *` - Daily at 2 AM (default)
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 3 */3 * *` - Every 3 days at 3 AM

---

## 🚀 Quick Start

### Linux/Mac Production Setup

```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Test manual backup
./scripts/backup-database.sh

# 3. Setup automated backups (2 AM daily)
./scripts/setup-backup-cron.sh

# 4. View logs
tail -f /var/log/crm-backup.log
```

### Windows Production Setup

```powershell
# 1. Test manual backup
.\scripts\backup-database.ps1

# 2. Setup Task Scheduler (daily at 2 AM)
# Open Task Scheduler → Create Basic Task → Daily at 2:00 AM
# Action: Start a program
# Program: powershell.exe
# Arguments: -File "E:\CRM_01\scripts\backup-database.ps1"
```

---

## 📊 Backup Management

### View Current Backups
```bash
ls -lh /backups/backup_*.sql.gz
```

### Restore from Backup
```bash
# Extract and restore
gunzip < /backups/backup_20251025_020000.sql.gz | \
  docker exec -i crm-postgres-prod psql -U postgres -d crm
```

**PowerShell**:
```powershell
# Restore from compressed backup
docker exec -i crm-postgres-prod psql -U postgres -d crm < backup_20251025_020000.sql
```

### Check Backup Size
```bash
du -sh /backups
```

---

## 🔍 Monitoring

### Check Backup Logs
```bash
# Linux/Mac
tail -f /var/log/crm-backup.log

# Windows
Get-Content .\backups\backup.log -Tail 50 -Wait
```

### Verify Cron Job
```bash
crontab -l | grep backup
```

### Test Backup Restoration (Dry Run)
```bash
# Test decompression only
gunzip -t /backups/backup_20251025_020000.sql.gz
echo "✅ Backup integrity verified"
```

---

## ⚠️ Important Notes

### Before Production
1. **Test backups** - Run manual backup and verify
2. **Test restoration** - Restore to test database
3. **Configure alerts** - Monitor backup failures
4. **Secure backups** - Restrict file permissions (`chmod 600`)

### Security Best Practices
```bash
# Secure backup directory
chmod 700 /backups
chown postgres:postgres /backups

# Secure backup files
chmod 600 /backups/*.sql.gz
```

### Disk Space Management
```bash
# Check available space
df -h /backups

# Estimate backup size (approximate DB size)
docker exec crm-postgres-prod psql -U postgres -d crm -c "SELECT pg_size_pretty(pg_database_size('crm'));"
```

---

## 🔧 Troubleshooting

### "Container not running"
```bash
docker ps | grep postgres
docker-compose -f docker-compose.prod.yml up -d postgres
```

### "Permission denied"
```bash
chmod +x scripts/backup-database.sh
```

### "Backup file corrupted"
```bash
# Verify integrity
gunzip -t /backups/backup_*.sql.gz

# Re-run backup
./scripts/backup-database.sh
```

### "Disk full"
```bash
# Clean old backups manually
find /backups -name "backup_*.sql.gz" -mtime +7 -delete

# Check disk space
df -h
```

---

## 📈 Advanced Configuration

### Off-site Backup with rsync
```bash
# Add to backup script or separate cron job
rsync -avz --delete /backups/ user@backup-server:/remote/backups/crm/
```

### S3 Backup Upload
```bash
# Add to backup script
aws s3 sync /backups/ s3://your-bucket/crm-backups/ --delete
```

### Encrypted Backups
```bash
# Encrypt backup with GPG
docker exec crm-postgres-prod pg_dump -U postgres crm | \
  gzip | \
  gpg --encrypt --recipient your@email.com > backup_encrypted.sql.gz.gpg
```

---

## ✅ Backup Checklist

- [ ] Scripts are executable (`chmod +x`)
- [ ] Manual backup tested successfully
- [ ] Backup restoration tested on test database
- [ ] Cron job configured and verified
- [ ] Backup directory has sufficient space (min 10GB recommended)
- [ ] Backup logs are being written
- [ ] Retention policy configured (30 days default)
- [ ] File permissions secured (`chmod 600`)
- [ ] Monitoring/alerting configured for failures
- [ ] Off-site backup configured (optional)

---

**Created**: October 25, 2025  
**Status**: Production Ready ✅
