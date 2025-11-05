# Database Backup Strategy Documentation

## Overview

Comprehensive automated backup system for CRM PostgreSQL database with:
- ✅ Automated daily backups
- ✅ 30-day retention policy
- ✅ AWS S3 offsite storage support
- ✅ Backup verification and integrity checks
- ✅ Point-in-time recovery with WAL archiving
- ✅ Restore testing capability
- ✅ Email notifications
- ✅ Cross-platform support (Linux/Windows)

## Table of Contents

- [Quick Start](#quick-start)
- [Backup Scripts](#backup-scripts)
- [Automated Scheduling](#automated-scheduling)
- [AWS S3 Integration](#aws-s3-integration)
- [Restore Procedures](#restore-procedures)
- [Backup Verification](#backup-verification)
- [Monitoring & Alerts](#monitoring--alerts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Set Up Environment Variables

```bash
# Required
export POSTGRES_USER="postgres"
export POSTGRES_DB="crm"
export POSTGRES_PASSWORD="your_password"
export BACKUP_DIR="/backups"

# Optional - S3 Offsite Storage
export S3_BUCKET="your-backup-bucket"
export S3_PREFIX="crm-backups"
export ENABLE_S3_UPLOAD="true"

# Optional - Email Notifications
export ENABLE_EMAIL_ALERTS="true"
export ALERT_EMAIL="admin@example.com"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
```

### 2. Create Backup Directory

```bash
mkdir -p /backups
chmod 755 /backups
```

### 3. Run Manual Backup (Test)

**Linux/Mac:**
```bash
cd scripts
chmod +x backup-database.sh
./backup-database.sh
```

**Windows PowerShell:**
```powershell
cd scripts
.\backup-database.ps1 -BackupDir "C:\backups"
```

### 4. Set Up Automated Backups

**Linux/Mac (Cron):**
```bash
cd scripts
chmod +x setup-backup-cron.sh
./setup-backup-cron.sh
```

**Windows (Task Scheduler):**
```powershell
cd scripts
.\setup-backup-task-scheduler.ps1 -BackupTime "02:00"
```

---

## Backup Scripts

### 1. `backup-database.sh` / `backup-database.ps1`

**Main backup script** that creates PostgreSQL dumps with compression.

**Features:**
- Custom format PostgreSQL dumps (`pg_dump --format=custom`)
- GZIP compression (9x compression ratio)
- WAL file backup for point-in-time recovery
- Automatic integrity verification
- Restore capability testing
- Retention policy enforcement (30 days default)
- S3 upload support
- Email notifications

**Usage:**

```bash
# Linux - Basic backup
./backup-database.sh

# Linux - With S3 upload
ENABLE_S3_UPLOAD=true S3_BUCKET=my-bucket ./backup-database.sh

# Windows - Basic backup
.\backup-database.ps1

# Windows - With S3 and email
.\backup-database.ps1 -EnableS3Upload $true -S3Bucket "my-bucket" -EnableEmailAlerts $true
```

**Output:**
```
/backups/
├── backup_20240315_143022.sql.gz    # SQL dump
├── wal_20240315_143022.tar.gz       # WAL files
├── backup.log                        # Backup logs
└── cron.log                          # Automated backup logs
```

### 2. `restore-database.sh` / `restore-database.ps1`

**Database restore script** with safety backups and rollback capability.

**Features:**
- Restore from local or S3 backups
- Automatic safety backup before restore
- Connection termination before restore
- Restore verification
- Automatic rollback on failure
- Support for "latest" keyword

**Usage:**

```bash
# Linux - Restore latest backup
./restore-database.sh latest

# Linux - Restore specific backup
./restore-database.sh backup_20240315_143022.sql.gz

# Linux - Restore from S3
RESTORE_FROM_S3=true ./restore-database.sh backup_20240315_143022.sql.gz

# Windows - Restore latest
.\restore-database.ps1 -RestoreFile "latest"

# Windows - Restore from S3
.\restore-database.ps1 -RestoreFile "backup_20240315_143022.sql.gz" -RestoreFromS3 $true
```

**Safety Features:**
- Creates pre-restore backup automatically
- Confirms before destructive operations
- Verifies backup integrity before restore
- Automatic rollback on restore failure
- Displays restore summary with table count

### 3. `verify-backup.sh`

**Backup verification script** that tests backup integrity and restorability.

**Tests Performed:**
1. **File Integrity**: GZIP decompression test
2. **SQL Format**: PostgreSQL dump header verification
3. **Restore Test**: Actual restore to temporary database
4. **Data Verification**: Table count validation
5. **Freshness Check**: Backup age verification

**Usage:**

```bash
# Verify latest backup
./verify-backup.sh

# Verify specific backup
./verify-backup.sh backup_20240315_143022.sql.gz

# Skip restore test (faster)
VERIFY_RESTORE=false ./verify-backup.sh
```

**Sample Output:**
```
Test 1: Verifying file integrity... ✅ PASS
Test 2: Checking SQL dump format... ✅ PASS
   - Tables: 15
   - Indexes: 32
Test 3: Verifying restore capability... ✅ PASS
   - Restored tables: 15
Test 4: Checking backup freshness... ✅ PASS

✅ All verification tests passed!
Backup is valid and restorable
```

---

## Automated Scheduling

### Linux/Mac - Cron Jobs

**1. Automated Setup:**
```bash
cd scripts
./setup-backup-cron.sh
```

**2. Manual Cron Configuration:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /backups/cron.log 2>&1

# Add weekly verification on Sundays at 3 AM
0 3 * * 0 /path/to/scripts/verify-backup.sh >> /backups/verify.log 2>&1
```

**3. Verify Cron Jobs:**
```bash
crontab -l
```

**4. View Logs:**
```bash
tail -f /backups/cron.log
```

### Windows - Task Scheduler

**1. Automated Setup:**
```powershell
cd scripts
.\setup-backup-task-scheduler.ps1
```

**2. Manual Task Configuration:**
```powershell
# Create scheduled task
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\backup-database.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "CRM-Database-Backup" -Action $Action -Trigger $Trigger -Settings $Settings
```

**3. Manage Task:**
```powershell
# View task
Get-ScheduledTask -TaskName "CRM-Database-Backup"

# Run manually
Start-ScheduledTask -TaskName "CRM-Database-Backup"

# Disable task
Disable-ScheduledTask -TaskName "CRM-Database-Backup"

# Remove task
Unregister-ScheduledTask -TaskName "CRM-Database-Backup"
```

---

## AWS S3 Integration

### Setup

**1. Install AWS CLI:**
```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
choco install awscli

# Verify
aws --version
```

**2. Configure AWS Credentials:**
```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

**3. Create S3 Bucket:**
```bash
# Create bucket with versioning
aws s3 mb s3://your-crm-backups --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket your-crm-backups \
    --versioning-configuration Status=Enabled

# Set lifecycle policy (delete after 90 days)
cat > lifecycle.json <<EOF
{
  "Rules": [{
    "Id": "DeleteOldBackups",
    "Status": "Enabled",
    "Expiration": { "Days": 90 },
    "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
  }]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket your-crm-backups \
    --lifecycle-configuration file://lifecycle.json
```

**4. Set Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/backup-user"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-crm-backups/*",
        "arn:aws:s3:::your-crm-backups"
      ]
    }
  ]
}
```

### Enable S3 Backups

```bash
# Environment variables
export ENABLE_S3_UPLOAD="true"
export S3_BUCKET="your-crm-backups"
export S3_PREFIX="crm-backups"

# Run backup with S3 upload
./backup-database.sh
```

### Verify S3 Backups

```bash
# List all backups
aws s3 ls s3://your-crm-backups/crm-backups/

# Download specific backup
aws s3 cp s3://your-crm-backups/crm-backups/backup_20240315_143022.sql.gz ./

# Restore from S3
RESTORE_FROM_S3=true ./restore-database.sh backup_20240315_143022.sql.gz
```

---

## Restore Procedures

### Emergency Restore Process

**1. Stop Application:**
```bash
# Docker Compose
docker-compose down backend

# Or stop specific container
docker stop crm-backend-prod
```

**2. List Available Backups:**
```bash
# Local backups
ls -lh /backups/backup_*.sql.gz

# S3 backups
aws s3 ls s3://your-crm-backups/crm-backups/
```

**3. Restore Database:**
```bash
# Interactive restore (requires confirmation)
./restore-database.sh backup_20240315_143022.sql.gz

# Or restore latest
./restore-database.sh latest
```

**4. Verify Restoration:**
```bash
# Connect to database
docker exec -it crm-postgres-prod psql -U postgres -d crm

# Check table counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check recent data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "Deal";
```

**5. Restart Application:**
```bash
docker-compose up -d backend
```

### Point-in-Time Recovery (PITR)

For recovering to a specific point in time using WAL files:

**1. Restore base backup:**
```bash
./restore-database.sh backup_20240315_020000.sql.gz
```

**2. Extract WAL files:**
```bash
cd /backups
tar xzf wal_20240315_020000.tar.gz
```

**3. Configure recovery:**
```bash
docker exec -it crm-postgres-prod bash

# Create recovery.conf
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /backups/pg_wal/%f %p'
recovery_target_time = '2024-03-15 14:30:00'
recovery_target_action = 'promote'
EOF

# Restart PostgreSQL
pg_ctl restart
```

---

## Backup Verification

### Automated Verification

**Daily Verification (Recommended):**
```bash
# Add to cron - verify after backup
5 2 * * * /path/to/scripts/verify-backup.sh >> /backups/verify.log 2>&1
```

**Weekly Full Restore Test:**
```bash
# Sunday 3 AM - full restore verification
0 3 * * 0 /path/to/scripts/verify-backup.sh latest >> /backups/verify-full.log 2>&1
```

### Manual Verification

```bash
# Quick verification (no restore test)
VERIFY_RESTORE=false ./verify-backup.sh

# Full verification with restore test
./verify-backup.sh latest

# Verify specific backup
./verify-backup.sh backup_20240315_143022.sql.gz
```

---

## Monitoring & Alerts

### Email Notifications

Configure email alerts for backup status:

```bash
# Environment variables
export ENABLE_EMAIL_ALERTS="true"
export ALERT_EMAIL="admin@example.com,backup-team@example.com"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="backups@example.com"
export SMTP_PASS="your-app-password"
```

**Alerts Sent:**
- ✅ Backup successful (includes size, duration)
- ❌ Backup failed (includes error details)
- ⚠️ Backup verification failed
- 💾 Low disk space warning

### Log Monitoring

```bash
# Watch backup logs in real-time
tail -f /backups/backup.log

# Watch cron logs
tail -f /backups/cron.log

# Search for errors
grep -i error /backups/*.log

# Check last 10 backups
tail -20 /backups/backup.log | grep "Backup completed"
```

### Disk Space Monitoring

```bash
# Check backup directory size
du -sh /backups

# List backups by size
du -h /backups/backup_*.sql.gz | sort -h

# Check available disk space
df -h /backups
```

### Integration with Sentry

The backup scripts automatically report failures to Sentry (if configured):

```bash
# Set Sentry DSN
export SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Backup failures are auto-reported with:
# - Backup file name
# - Error message
# - Database size
# - Disk space
```

---

## Best Practices

### 1. **3-2-1 Backup Rule**
- ✅ **3 copies**: Original + local backup + S3
- ✅ **2 different media**: Disk + cloud storage
- ✅ **1 offsite**: AWS S3 in different region

### 2. **Regular Testing**
- Test restore **monthly** (minimum)
- Verify backup integrity **daily**
- Full restore test **quarterly**
- Document restore time (RTO)

### 3. **Retention Policy**
```
Daily backups:    Keep for 30 days (local)
Weekly backups:   Keep for 90 days (S3)
Monthly backups:  Keep for 1 year (S3 Glacier)
```

### 4. **Security**
- Encrypt backups at rest (S3 encryption enabled)
- Encrypt backups in transit (SSL/TLS)
- Restrict backup access (IAM policies)
- Audit backup access logs
- Never commit credentials to git

### 5. **Monitoring**
- Alert on backup failures
- Monitor backup size trends
- Track backup duration
- Alert on disk space < 20%
- Weekly backup report email

### 6. **Documentation**
- Document restore procedures
- Maintain runbook for emergencies
- Keep contact list updated
- Document RPO/RTO requirements

---

## Troubleshooting

### Backup Fails with "Container not running"

**Solution:**
```bash
# Check container status
docker ps -a | grep postgres

# Start container
docker start crm-postgres-prod

# Verify health
docker exec crm-postgres-prod pg_isready
```

### Backup File is Corrupted

**Solution:**
```bash
# Test file integrity
gunzip -t /backups/backup_20240315_143022.sql.gz

# If corrupted, restore from S3
aws s3 cp s3://your-crm-backups/crm-backups/backup_20240315_143022.sql.gz ./

# Or use previous backup
./restore-database.sh backup_20240314_143022.sql.gz
```

### S3 Upload Fails

**Solution:**
```bash
# Test AWS credentials
aws s3 ls s3://your-crm-backups/

# Check bucket permissions
aws s3api get-bucket-policy --bucket your-crm-backups

# Verify IAM permissions
aws iam get-user

# Manual upload
aws s3 cp /backups/backup_latest.sql.gz s3://your-crm-backups/crm-backups/
```

### Restore Fails - "Database already exists"

**Solution:**
```bash
# Force drop database
docker exec crm-postgres-prod psql -U postgres -c "DROP DATABASE IF EXISTS crm;"
docker exec crm-postgres-prod psql -U postgres -c "CREATE DATABASE crm;"

# Retry restore
./restore-database.sh backup_20240315_143022.sql.gz
```

### Disk Space Full

**Solution:**
```bash
# Find large backups
du -h /backups/*.gz | sort -h | tail -10

# Delete old backups manually
find /backups -name "backup_*.sql.gz" -mtime +30 -delete

# Or adjust retention
export RETENTION_DAYS=15
./backup-database.sh
```

### Cron Job Not Running

**Solution:**
```bash
# Check crontab
crontab -l | grep backup

# Check cron service
sudo systemctl status cron  # Linux
sudo service crond status   # CentOS

# Check logs
grep CRON /var/log/syslog
tail -f /backups/cron.log

# Test script manually
/path/to/scripts/backup-database.sh
```

---

## Recovery Time Objectives (RTO)

| Backup Size | Local Restore | S3 Download + Restore |
|-------------|---------------|----------------------|
| < 1 GB      | 2-5 minutes   | 5-10 minutes        |
| 1-5 GB      | 5-15 minutes  | 10-20 minutes       |
| 5-10 GB     | 15-30 minutes | 20-40 minutes       |
| > 10 GB     | 30-60 minutes | 40-90 minutes       |

**RTO Target**: < 1 hour for any backup size

---

## Support & Contact

For backup-related issues:
1. Check logs: `/backups/backup.log`
2. Verify disk space: `df -h /backups`
3. Test backup manually: `./backup-database.sh`
4. Check S3 uploads: `aws s3 ls s3://your-bucket/`
5. Contact: backup-admin@example.com

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
