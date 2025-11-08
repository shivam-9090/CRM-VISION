# Disaster Recovery Plan (DRP)

**CRM-VISION System - Version 1.0**  
**Last Updated**: November 8, 2025  
**Status**: ✅ Production Ready

---

## Executive Summary

This Disaster Recovery Plan defines procedures, objectives, and responsibilities for recovering the CRM-VISION system from various disaster scenarios. The plan ensures business continuity with minimal data loss and downtime.

**Key Metrics:**
- **RTO (Recovery Time Objective)**: < 2 hours for critical systems
- **RPO (Recovery Point Objective)**: < 15 minutes of data loss
- **Backup Frequency**: Every 2 hours (automated)
- **Offsite Backup**: AWS S3 with cross-region replication

---

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [System Architecture Overview](#system-architecture-overview)
3. [Disaster Scenarios & Response](#disaster-scenarios--response)
4. [Emergency Procedures](#emergency-procedures)
5. [Backup & Restore Procedures](#backup--restore-procedures)
6. [Infrastructure Failover](#infrastructure-failover)
7. [Emergency Contacts](#emergency-contacts)
8. [DR Testing & Validation](#dr-testing--validation)
9. [Post-Recovery Checklist](#post-recovery-checklist)
10. [Appendix](#appendix)

---

## 1. Recovery Objectives

### Recovery Time Objectives (RTO)

| System Component | RTO | Priority | Impact if Down |
|------------------|-----|----------|----------------|
| Database (PostgreSQL) | < 1 hour | **P0 - Critical** | Complete system failure |
| Backend API | < 30 minutes | **P0 - Critical** | No user access |
| Redis Cache | < 15 minutes | **P1 - High** | Degraded performance |
| Frontend | < 30 minutes | **P1 - High** | User interface unavailable |
| Email Service | < 2 hours | **P2 - Medium** | Notifications delayed |
| File Storage | < 4 hours | **P3 - Low** | Attachments unavailable |

### Recovery Point Objectives (RPO)

| Data Type | RPO | Backup Frequency | Acceptable Data Loss |
|-----------|-----|------------------|---------------------|
| Transactional Data | < 15 minutes | Every 2 hours + WAL | Last 15 min max |
| User Data | < 15 minutes | Every 2 hours | Minimal |
| File Uploads | < 1 hour | Daily | Last hour of uploads |
| System Logs | < 24 hours | Daily | Last day acceptable |
| Configuration | < 1 hour | On change + daily | Recent changes |

### Business Impact Analysis

| Downtime Duration | Business Impact | Revenue Loss | Customer Impact |
|-------------------|-----------------|--------------|-----------------|
| 0-30 minutes | Minimal | None | Minor inconvenience |
| 30-60 minutes | Low | < $1,000 | Noticeable disruption |
| 1-4 hours | Moderate | $1,000-$5,000 | Customer complaints |
| 4-8 hours | High | $5,000-$20,000 | SLA violations |
| > 8 hours | Critical | > $20,000 | Customer churn risk |

---

## 2. System Architecture Overview

### Production Environment

```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                      │
│                 (Nginx/CloudFlare)                   │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼────┐
    │ Frontend │          │ Backend  │
    │ (Next.js)│          │ (NestJS) │
    │ Port 3000│          │ Port 3001│
    └──────────┘          └─────┬────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
            ┌────▼────┐    ┌───▼───┐    ┌────▼────┐
            │ PostgreSQL│   │ Redis │    │ Email   │
            │ Primary  │   │ Cache │    │ Queue   │
            │ Port 5432│   │Port6379    │ (Bull)  │
            └────┬────┘    └───────┘    └─────────┘
                 │
          ┌──────┴──────┐
          │             │
    ┌─────▼────┐  ┌────▼─────┐
    │ Replica  │  │  Backups │
    │ (Standby)│  │  (S3)    │
    └──────────┘  └──────────┘
```

### Critical Dependencies

1. **Database**: PostgreSQL 15 (Primary + Replica)
2. **Cache**: Redis 7 (In-memory + Persistence)
3. **Storage**: AWS S3 (Backups + Files)
4. **Monitoring**: Sentry + Winston
5. **Container Runtime**: Docker 24+
6. **Orchestration**: Docker Compose

---

## 3. Disaster Scenarios & Response

### Scenario 1: Database Failure

**Symptoms:**
- Backend returns database connection errors
- Health check endpoint fails
- PostgreSQL container stopped/crashed

**Immediate Response (< 5 minutes):**
```bash
# 1. Check container status
docker ps -a | grep postgres

# 2. Check logs
docker logs crm-postgres-prod --tail 100

# 3. Attempt restart
docker restart crm-postgres-prod

# 4. Verify health
docker exec crm-postgres-prod pg_isready -U postgres
```

**Recovery Steps (5-60 minutes):**

**Option A: Container Restart (5 min)**
```bash
# If container healthy but not responding
docker restart crm-postgres-prod
docker exec crm-postgres-prod psql -U postgres -d crm -c "SELECT COUNT(*) FROM users;"
```

**Option B: Failover to Replica (15 min)**
```bash
# 1. Promote standby replica
docker exec crm-postgres-replica pg_ctl promote

# 2. Update backend connection string
export DATABASE_URL="postgresql://user:pass@replica-host:5432/crm"

# 3. Restart backend
docker restart crm-backend-prod

# 4. Verify connection
curl http://localhost:3001/health
```

**Option C: Full Restore (30-60 min)**
```bash
# 1. Create safety backup of current state (if accessible)
./scripts/backup-database.sh

# 2. Stop backend to prevent write attempts
docker stop crm-backend-prod

# 3. Restore from latest backup
./scripts/restore-database.sh latest

# 4. Verify data integrity
docker exec crm-postgres-prod psql -U postgres -d crm -c "
  SELECT 'Users: ' || COUNT(*) FROM users
  UNION ALL
  SELECT 'Companies: ' || COUNT(*) FROM companies
  UNION ALL
  SELECT 'Deals: ' || COUNT(*) FROM deals;
"

# 5. Restart backend
docker start crm-backend-prod

# 6. Monitor logs
docker logs -f crm-backend-prod
```

**Validation:**
- [ ] Database accepts connections
- [ ] All tables accessible
- [ ] Recent data present (check last created record)
- [ ] Backend API responds
- [ ] Frontend loads correctly

---

### Scenario 2: Complete Server Crash

**Symptoms:**
- All services unresponsive
- SSH connection lost
- Monitoring alerts triggered

**Immediate Response (< 10 minutes):**

```bash
# 1. SSH into server (or use console access)
ssh admin@production-server

# 2. Check system status
systemctl status
docker ps -a
df -h  # Check disk space
free -h  # Check memory

# 3. Restart Docker daemon if needed
sudo systemctl restart docker

# 4. Bring up services
cd /opt/crm-vision
docker-compose -f docker-compose.prod.yml up -d
```

**Recovery Steps (10-120 minutes):**

**Full System Recovery:**
```bash
# 1. Clone repository (if files lost)
git clone https://github.com/shivam-9090/CRM-VISION.git
cd CRM-VISION

# 2. Restore environment variables
# Copy from backup or secure vault
cp /backup/.env.production .env.production

# 3. Pull latest images
docker-compose -f docker-compose.prod.yml pull

# 4. Restore database from S3
aws s3 cp s3://crm-backups/latest/backup_latest.sql.gz /tmp/
./scripts/restore-database.sh /tmp/backup_latest.sql.gz

# 5. Start all services
docker-compose -f docker-compose.prod.yml up -d

# 6. Wait for health checks
sleep 30

# 7. Verify all services
docker ps
curl http://localhost:3001/health
curl http://localhost:3000
```

**Validation Checklist:**
- [ ] All containers running
- [ ] Database responding
- [ ] Redis cache operational
- [ ] Backend API healthy
- [ ] Frontend accessible
- [ ] User login functional
- [ ] Data integrity verified

---

### Scenario 3: Data Corruption

**Symptoms:**
- Inconsistent data returned
- Foreign key violations
- Duplicate or missing records
- Schema mismatch errors

**Immediate Response (< 5 minutes):**

```bash
# 1. STOP backend immediately to prevent further corruption
docker stop crm-backend-prod

# 2. Create emergency backup of current state
./scripts/backup-database.sh

# 3. Assess corruption extent
docker exec crm-postgres-prod psql -U postgres -d crm -c "
  -- Check for orphaned records
  SELECT 'Orphaned Deals: ' || COUNT(*) FROM deals WHERE \"companyId\" NOT IN (SELECT id FROM companies);
  
  -- Check table counts
  SELECT schemaname, tablename, n_live_tup 
  FROM pg_stat_user_tables 
  ORDER BY n_live_tup DESC;
"
```

**Recovery Options:**

**Option A: Point-in-Time Recovery (PITR) - 30-60 min**
```bash
# 1. Identify last known good timestamp
RECOVERY_TIME="2025-11-08 14:30:00"

# 2. Restore base backup
./scripts/restore-database.sh backup_20251108_020000.sql.gz

# 3. Apply WAL files up to recovery point
docker exec crm-postgres-prod bash -c "
  mkdir -p /tmp/wal_restore
  aws s3 sync s3://crm-backups/wal/ /tmp/wal_restore/
  
  # Configure recovery
  cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /tmp/wal_restore/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF
"

# 4. Restart PostgreSQL to trigger recovery
docker restart crm-postgres-prod

# 5. Monitor recovery
docker logs -f crm-postgres-prod
```

**Option B: Full Restore from Last Clean Backup - 15-30 min**
```bash
# 1. List available backups
ls -lh /backups/backup_*.sql.gz
aws s3 ls s3://crm-backups/

# 2. Choose last known clean backup
./scripts/restore-database.sh backup_20251108_000000.sql.gz

# 3. Verify data integrity
./scripts/verify-backup.sh
```

**Validation:**
- [ ] No foreign key violations
- [ ] Expected record counts match
- [ ] Recent transactions present
- [ ] No duplicate primary keys
- [ ] Schema matches expected state

---

### Scenario 4: Security Breach / Ransomware

**Symptoms:**
- Unauthorized access detected
- Files encrypted or deleted
- Suspicious database activity
- Alert from security monitoring

**CRITICAL - Immediate Actions (< 2 minutes):**

```bash
# 1. ISOLATE SYSTEM - Disconnect from network
sudo iptables -A INPUT -j DROP
sudo iptables -A OUTPUT -j DROP

# 2. STOP ALL SERVICES
docker-compose -f docker-compose.prod.yml down

# 3. PRESERVE EVIDENCE
tar -czf /secure/forensics_$(date +%s).tar.gz /var/log /opt/crm-vision

# 4. NOTIFY SECURITY TEAM (see Emergency Contacts)
```

**Investigation Phase (2-60 minutes):**

```bash
# 1. Check for unauthorized access
docker logs crm-backend-prod | grep -i "401\|403\|failed"

# 2. Review recent database changes
docker exec crm-postgres-prod psql -U postgres -d crm -c "
  SELECT * FROM audit_logs 
  WHERE \"createdAt\" > NOW() - INTERVAL '2 hours'
  ORDER BY \"createdAt\" DESC
  LIMIT 100;
"

# 3. Check for suspicious processes
docker exec crm-backend-prod ps aux
docker exec crm-postgres-prod ps aux

# 4. Review file modifications
find /opt/crm-vision -type f -mtime -1 -ls
```

**Recovery Steps (1-4 hours):**

```bash
# 1. Rebuild from clean images
docker system prune -a --force
docker-compose -f docker-compose.prod.yml pull

# 2. Restore database from verified clean backup
# Use backup from BEFORE breach timestamp
./scripts/restore-database.sh backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Update all secrets and credentials
# Generate new JWT secrets
openssl rand -base64 64 > /tmp/new_jwt_secret

# Update environment
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(cat /tmp/new_jwt_secret)/" .env.production

# 4. Rebuild and deploy with hardened configuration
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Force all users to reset passwords
docker exec crm-postgres-prod psql -U postgres -d crm -c "
  UPDATE users SET 
    password = 'FORCE_RESET',
    \"resetToken\" = md5(random()::text),
    \"resetTokenExpiry\" = NOW() + INTERVAL '24 hours';
"
```

**Post-Breach Actions:**
- [ ] Notify all users of breach
- [ ] File incident report
- [ ] Update security policies
- [ ] Implement additional monitoring
- [ ] Review access logs
- [ ] Update firewall rules
- [ ] Rotate all API keys
- [ ] Conduct security audit

---

### Scenario 5: Redis Cache Failure

**Symptoms:**
- Slow API responses (3-10x slower)
- Cache miss rate = 100%
- Redis connection errors in logs

**Recovery Steps (5-15 minutes):**

```bash
# 1. Check Redis status
docker ps -a | grep redis
docker logs crm-redis-prod --tail 50

# 2. Attempt restart
docker restart crm-redis-prod

# 3. Verify Redis health
docker exec crm-redis-prod redis-cli ping
# Expected: PONG

# 4. Check memory usage
docker exec crm-redis-prod redis-cli INFO memory

# 5. If restart fails, recreate container
docker stop crm-redis-prod
docker rm crm-redis-prod
docker-compose -f docker-compose.prod.yml up -d redis

# 6. Backend will auto-reconnect (no restart needed)
# Monitor logs for successful reconnection
docker logs crm-backend-prod | grep -i redis
```

**Validation:**
- [ ] Redis accepts connections
- [ ] Cache operations working
- [ ] API response times normal
- [ ] No connection errors in logs

**Impact**: System remains functional but slower. No data loss.

---

## 4. Emergency Procedures

### Quick Reference Emergency Commands

```bash
# === STOP EVERYTHING ===
docker-compose -f docker-compose.prod.yml down

# === START EVERYTHING ===
docker-compose -f docker-compose.prod.yml up -d

# === RESTART SPECIFIC SERVICE ===
docker restart crm-backend-prod
docker restart crm-postgres-prod
docker restart crm-redis-prod
docker restart crm-frontend-prod

# === CHECK HEALTH ===
curl http://localhost:3001/health
curl http://localhost:3000

# === VIEW LOGS (LAST 100 LINES) ===
docker logs crm-backend-prod --tail 100
docker logs crm-postgres-prod --tail 100

# === EMERGENCY BACKUP ===
./scripts/backup-database.sh

# === EMERGENCY RESTORE ===
./scripts/restore-database.sh latest

# === CHECK DISK SPACE ===
df -h

# === CHECK MEMORY ===
free -h

# === CHECK DOCKER STATUS ===
docker ps -a
docker stats --no-stream
```

---

## 5. Backup & Restore Procedures

### Backup Schedule

| Backup Type | Frequency | Retention | Location | Size (Avg) |
|-------------|-----------|-----------|----------|------------|
| Full Database | Every 2 hours | 7 days local | `/backups` + S3 | 500 MB |
| WAL Archives | Continuous | 7 days | S3 | 100 MB/day |
| File Uploads | Daily | 30 days | S3 | 2 GB |
| Configuration | On change | 90 days | Git + S3 | 10 MB |
| Docker Volumes | Daily | 7 days | S3 | 1 GB |
| System Logs | Daily | 30 days | S3 | 200 MB/day |

### Automated Backup Configuration

**Cron Jobs (Linux):**
```bash
# Edit crontab
crontab -e

# Database backup every 2 hours
0 */2 * * * /opt/crm-vision/scripts/backup-database.sh >> /backups/cron.log 2>&1

# Verify backups daily at 3 AM
0 3 * * * /opt/crm-vision/scripts/verify-backup.sh >> /backups/verify.log 2>&1

# Cleanup old backups daily at 4 AM
0 4 * * * find /backups -name "backup_*.sql.gz" -mtime +7 -delete
```

**Task Scheduler (Windows):**
```powershell
# Run as Administrator
.\scripts\setup-backup-task-scheduler.ps1 -BackupTime "00:00" -IntervalHours 2
```

### Manual Backup Procedures

**Full Database Backup:**
```bash
cd /opt/crm-vision
./scripts/backup-database.sh

# With S3 upload
ENABLE_S3_UPLOAD=true S3_BUCKET=crm-backups ./scripts/backup-database.sh
```

**Configuration Backup:**
```bash
# Backup environment and configs
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env.production \
  docker-compose.prod.yml \
  backend/.env \
  frontend/.env

# Upload to S3
aws s3 cp config_backup_$(date +%Y%m%d).tar.gz s3://crm-backups/configs/
```

### Restore Procedures

**Standard Restore (Production):**
```bash
# 1. Announce maintenance window
echo "System maintenance in progress" > /var/www/maintenance.html

# 2. Stop backend to prevent writes
docker stop crm-backend-prod

# 3. Create safety backup of current state
./scripts/backup-database.sh

# 4. List available backups
ls -lh /backups/backup_*.sql.gz
aws s3 ls s3://crm-backups/

# 5. Restore selected backup
./scripts/restore-database.sh backup_20251108_140000.sql.gz

# 6. Verify restoration
./scripts/verify-backup.sh

# 7. Restart backend
docker start crm-backend-prod

# 8. Verify application
curl http://localhost:3001/health
curl http://localhost:3001/api/deals  # Test API

# 9. Remove maintenance page
rm /var/www/maintenance.html
```

**Emergency Fast Restore (< 10 minutes):**
```bash
# Use latest backup immediately
docker stop crm-backend-prod
./scripts/restore-database.sh latest
docker start crm-backend-prod
```

---

## 6. Infrastructure Failover

### Database Failover (PostgreSQL Replication)

**Setup Streaming Replication:**
```bash
# On Primary
docker exec crm-postgres-prod psql -U postgres -c "
  CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD 'repl_password';
"

# Configure pg_hba.conf
docker exec crm-postgres-prod bash -c "
  echo 'host replication replicator replica_ip/32 md5' >> /var/lib/postgresql/data/pg_hba.conf
"

# On Replica
docker exec crm-postgres-replica bash -c "
  pg_basebackup -h primary_ip -U replicator -D /var/lib/postgresql/data -P --wal-method=stream
"
```

**Promote Replica to Primary:**
```bash
# 1. Verify replica is up-to-date
docker exec crm-postgres-replica psql -U postgres -c "SELECT pg_last_wal_receive_lsn();"

# 2. Promote replica
docker exec crm-postgres-replica pg_ctl promote

# 3. Update backend connection
export DATABASE_URL="postgresql://user:pass@replica-host:5432/crm"

# 4. Update .env.production
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://user:pass@replica-host:5432/crm|' .env.production

# 5. Restart backend
docker restart crm-backend-prod
```

### Redis Failover

**Redis Sentinel (High Availability):**
```yaml
# docker-compose.prod.yml additions
redis-sentinel:
  image: redis:7-alpine
  command: redis-sentinel /etc/redis/sentinel.conf
  volumes:
    - ./redis-sentinel.conf:/etc/redis/sentinel.conf
```

**Manual Redis Failover:**
```bash
# 1. Start new Redis instance
docker run -d --name crm-redis-backup -p 6380:6379 redis:7-alpine

# 2. Update backend Redis URL
export REDIS_URL="redis://localhost:6380"

# 3. Restart backend
docker restart crm-backend-prod

# Cache will rebuild automatically
```

### Load Balancer Failover

**Nginx Configuration:**
```nginx
upstream backend {
    server backend1:3001 max_fails=3 fail_timeout=30s;
    server backend2:3001 backup;
}

upstream frontend {
    server frontend1:3000 max_fails=3 fail_timeout=30s;
    server frontend2:3000 backup;
}
```

---

## 7. Emergency Contacts

### Primary Response Team

| Role | Name | Phone | Email | Availability |
|------|------|-------|-------|--------------|
| **Incident Commander** | [Name] | [Phone] | incident@company.com | 24/7 |
| **Database Admin (DBA)** | [Name] | [Phone] | dba@company.com | 24/7 |
| **DevOps Lead** | [Name] | [Phone] | devops@company.com | 24/7 |
| **Security Lead** | [Name] | [Phone] | security@company.com | 24/7 |
| **CTO** | [Name] | [Phone] | cto@company.com | Escalation |

### Escalation Path

```
Level 1: On-Call Engineer (0-15 min response)
    ↓ (if unresolved after 30 min)
Level 2: Team Lead (15-30 min response)
    ↓ (if unresolved after 1 hour)
Level 3: Engineering Manager (30-60 min response)
    ↓ (if business critical)
Level 4: CTO (Immediate)
```

### External Contacts

| Service Provider | Contact | Account ID | Support Level |
|-----------------|---------|------------|---------------|
| AWS Support | +1-xxx-xxx-xxxx | [Account #] | Business |
| CloudFlare | support@cloudflare.com | [Account #] | Pro |
| Sentry | support@sentry.io | [Org ID] | Business |
| Domain Registrar | [Contact] | [Account #] | Premium |

### Communication Channels

- **Incident Slack**: `#incidents`
- **Status Page**: https://status.crm-vision.com
- **Emergency Email**: incidents@company.com
- **PagerDuty**: [Integration Key]

---

## 8. DR Testing & Validation

### Testing Schedule

| Test Type | Frequency | Duration | Participants |
|-----------|-----------|----------|--------------|
| **Backup Verification** | Daily | 10 min | Automated |
| **Restore Test** | Weekly | 30 min | DBA |
| **Failover Drill** | Monthly | 1 hour | DevOps Team |
| **Full DR Simulation** | Quarterly | 4 hours | All Engineering |
| **Tabletop Exercise** | Semi-annually | 2 hours | Leadership |

### DR Test Checklist

**Weekly Restore Test:**
- [ ] Select random backup from last 7 days
- [ ] Restore to test environment
- [ ] Verify data integrity (row counts, checksums)
- [ ] Test application functionality
- [ ] Measure restore time (should be < RTO)
- [ ] Document any issues
- [ ] Update procedures if needed

**Monthly Failover Drill:**
- [ ] Simulate primary database failure
- [ ] Promote replica to primary
- [ ] Update backend configuration
- [ ] Verify application connectivity
- [ ] Test read/write operations
- [ ] Failback to original primary
- [ ] Document timing and issues

**Quarterly Full DR Simulation:**
- [ ] Schedule maintenance window
- [ ] Simulate complete system failure
- [ ] Restore all services from backups
- [ ] Verify end-to-end functionality
- [ ] Test all disaster scenarios
- [ ] Measure actual vs. target RTO/RPO
- [ ] Conduct post-mortem
- [ ] Update DR plan based on findings

### Test Documentation Template

```markdown
# DR Test Report - [Date]

**Test Type**: [Restore/Failover/Full Simulation]
**Duration**: [Actual time taken]
**Target RTO**: [Expected time]
**Status**: [✅ Pass / ❌ Fail / ⚠️ Partial]

## Participants
- [Name 1, Role]
- [Name 2, Role]

## Scenario Tested
[Description of disaster scenario]

## Steps Executed
1. [Step 1]
2. [Step 2]
...

## Results
- Restore time: [X minutes]
- Data loss: [X minutes of data]
- Issues encountered: [List]

## Action Items
- [ ] [Action 1]
- [ ] [Action 2]

## Recommendations
[Improvements to DR plan]
```

---

## 9. Post-Recovery Checklist

### Immediate Validation (< 30 min)

- [ ] All containers running: `docker ps`
- [ ] Database accepting connections
- [ ] Backend API responding: `curl http://localhost:3001/health`
- [ ] Frontend loading: `curl http://localhost:3000`
- [ ] Redis cache operational
- [ ] No error logs in last 5 minutes

### Data Integrity Verification (30-60 min)

```bash
# Run data validation queries
docker exec crm-postgres-prod psql -U postgres -d crm <<EOF
-- Check record counts
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL SELECT 'Companies: ' || COUNT(*) FROM companies
UNION ALL SELECT 'Deals: ' || COUNT(*) FROM deals
UNION ALL SELECT 'Contacts: ' || COUNT(*) FROM contacts
UNION ALL SELECT 'Activities: ' || COUNT(*) FROM activities;

-- Check recent data
SELECT 'Last User Created: ' || MAX("createdAt") FROM users;
SELECT 'Last Deal Created: ' || MAX("createdAt") FROM deals;

-- Check for orphaned records
SELECT 'Orphaned Deals: ' || COUNT(*) FROM deals 
WHERE "companyId" NOT IN (SELECT id FROM companies);
EOF
```

Checklist:
- [ ] Record counts match expected values
- [ ] No orphaned records (foreign key integrity)
- [ ] Recent transactions present (check last 1 hour)
- [ ] No missing critical data
- [ ] Audit logs continuous (no gaps)

### Functional Testing (1-2 hours)

- [ ] User login successful
- [ ] Create new deal
- [ ] Update contact information
- [ ] Create activity/task
- [ ] Upload attachment
- [ ] Send email notification
- [ ] View dashboard analytics
- [ ] Export data (CSV)
- [ ] Search functionality
- [ ] Websocket notifications working

### Performance Validation

```bash
# Check response times
ab -n 100 -c 10 http://localhost:3001/api/health
# Target: < 100ms avg

# Check database query performance
docker exec crm-postgres-prod psql -U postgres -d crm -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;
"
```

Checklist:
- [ ] API response times < 500ms
- [ ] Database queries < 100ms avg
- [ ] Cache hit ratio > 80%
- [ ] Memory usage normal
- [ ] CPU usage < 70%

### Monitoring & Alerts

- [ ] Sentry receiving events
- [ ] Log aggregation working
- [ ] Health checks passing
- [ ] Prometheus metrics collecting
- [ ] Alert rules active
- [ ] Status page updated

### Communication

- [ ] Notify users service restored
- [ ] Update status page
- [ ] Send all-clear to team
- [ ] Document incident in wiki
- [ ] Schedule post-mortem meeting

---

## 10. Appendix

### A. Environment Variables Checklist

Critical variables to backup and restore:

```bash
# Backend
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
SENTRY_DSN
SMTP_HOST
SMTP_USER
SMTP_PASS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET

# Frontend
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SENTRY_DSN
```

### B. Backup Storage Locations

```
Local:
  /backups/backup_*.sql.gz (7 days retention)
  /backups/wal_*.tar.gz (7 days retention)

AWS S3:
  s3://crm-backups/database/ (30 days)
  s3://crm-backups/wal/ (30 days)
  s3://crm-backups/configs/ (90 days)
  s3://crm-backups/files/ (90 days)

S3 Glacier (Long-term):
  s3://crm-backups-archive/monthly/ (1 year)
```

### C. Recovery Time Estimates

| Backup Size | Local Restore | S3 Download | Total RTO |
|-------------|---------------|-------------|-----------|
| < 1 GB | 2-5 min | 3-5 min | 5-10 min |
| 1-5 GB | 5-15 min | 5-10 min | 10-25 min |
| 5-10 GB | 15-30 min | 10-20 min | 25-50 min |
| > 10 GB | 30-60 min | 20-40 min | 50-100 min |

### D. Cost of Downtime

| Hour | Lost Revenue | Recovery Cost | Total Cost |
|------|--------------|---------------|------------|
| 1 | $2,000 | $500 | $2,500 |
| 4 | $8,000 | $1,000 | $9,000 |
| 8 | $16,000 | $2,000 | $18,000 |
| 24 | $48,000 | $5,000 | $53,000 |

### E. Compliance Requirements

- GDPR: Data recovery must include user consent records
- SOC 2: All recovery actions must be logged
- PCI-DSS: Payment data must be restored with encryption
- HIPAA: PHI data must be restored within 4 hours

### F. Related Documentation

- [Database Backup Strategy](./DATABASE_BACKUP_STRATEGY.md)
- [Monitoring Setup](./backend/MONITORING_SETUP.md)
- [Security Headers](./SECURITY_HEADERS.md)
- [Deployment Guide](./DOCKER_GUIDE.md)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | DevOps Team | Initial DR plan |

**Next Review Date**: February 8, 2026  
**Document Owner**: DevOps Lead  
**Approval**: CTO

---

**END OF DISASTER RECOVERY PLAN**
