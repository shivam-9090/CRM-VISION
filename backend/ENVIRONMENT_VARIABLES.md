# Environment Variables Documentation

Complete guide to configuring environment variables for the CRM backend application.

## 📋 Table of Contents

- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Production Requirements](#production-requirements)
- [Security Best Practices](#security-best-practices)
- [Validation Rules](#validation-rules)
- [Examples](#examples)

---

## Required Variables

These variables **MUST** be set for the application to start:

### `DATABASE_URL`
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://user:password@host:port/database?schema=public`
- **Example**: `postgresql://postgres:securepass@db.example.com:5432/crm_prod?schema=public`
- **Security**:
  - Password must be 16+ characters in production
  - Must NOT use `localhost` or `127.0.0.1` in production
  - Avoid common passwords like `postgres`, `admin`, `password`

### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Format**: Cryptographically random string
- **Minimum Length**: 
  - Development: 32 characters
  - Production: 64 characters
- **Example**: Use `openssl rand -base64 64` to generate
- **Security**:
  - Must NOT contain patterns like: `secret`, `password`, `test`, `example`, `DO_NOT_SHARE`
  - Should be unique per environment
  - NEVER commit to version control

---

## Production Requirements

Additional variables **REQUIRED** when `NODE_ENV=production`:

### `SENTRY_DSN`
- **Description**: Sentry Data Source Name for error monitoring
- **Format**: URL provided by Sentry
- **Example**: `https://abc123@o123456.ingest.sentry.io/7890123`
- **Get From**: https://sentry.io (create project)

### `SMTP_HOST`
- **Description**: SMTP server hostname for sending emails
- **Example**: `smtp.gmail.com`, `smtp.sendgrid.net`

### `SMTP_USER`
- **Description**: SMTP authentication username (usually email)
- **Example**: `notifications@yourcompany.com`

### `SMTP_PASS`
- **Description**: SMTP authentication password
- **Security**: Use app-specific passwords (e.g., Gmail App Password)

---

## Optional Variables

### Server Configuration

#### `PORT`
- **Description**: Port number for the backend server
- **Default**: `3001`
- **Range**: 1-65535
- **Example**: `3001`

#### `NODE_ENV`
- **Description**: Application environment
- **Valid Values**: `development`, `production`, `test`, `staging`
- **Default**: `development`
- **Impact**: Changes validation rules, logging, and security requirements

#### `FRONTEND_URL`
- **Description**: Frontend application URL for CORS configuration
- **Format**: Valid URL
- **Example**: `http://localhost:3000`, `https://app.yourcompany.com`
- **Default**: Allows common local network ranges

---

### JWT Configuration

#### `JWT_EXPIRES_IN`
- **Description**: Access token expiration time
- **Default**: `15m`
- **Format**: Time string (e.g., `15m`, `1h`, `7d`)
- **Recommendation**: 15-30 minutes for security

#### `JWT_REFRESH_EXPIRES_IN`
- **Description**: Refresh token expiration time
- **Default**: `7d`
- **Format**: Time string
- **Recommendation**: 7-30 days

---

### Monitoring & Logging

#### `SENTRY_RELEASE`
- **Description**: Release version for Sentry tracking
- **Example**: `crm-backend@1.2.3`
- **Optional**: Helps track errors per release

#### `SENTRY_ENABLE_DEV`
- **Description**: Enable Sentry in development
- **Default**: `false`
- **Values**: `true`, `false`

#### `HOSTNAME`
- **Description**: Server identifier for logs
- **Example**: `crm-server-01`, `backend-prod-us-east`
- **Use Case**: Distinguish logs from multiple servers

---

### Email Configuration

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Common Values**: 
  - `587` (TLS/STARTTLS - recommended)
  - `465` (SSL)
  - `25` (unencrypted - not recommended)
- **Default**: `587`

#### `EMAIL_FROM`
- **Description**: "From" email address for outgoing emails
- **Example**: `noreply@yourcompany.com`
- **Default**: Uses `SMTP_USER` if not set

---

### Redis Configuration

#### `REDIS_HOST`
- **Description**: Redis server hostname
- **Default**: `localhost`
- **Docker**: Use `redis` (service name)
- **Example**: `redis.example.com`

#### `REDIS_PORT`
- **Description**: Redis server port
- **Default**: `6379`
- **Range**: 1-65535

#### `REDIS_PASSWORD`
- **Description**: Redis authentication password
- **Default**: None (empty string)
- **Production**: **STRONGLY RECOMMENDED** to set

---

### Backup Configuration

#### `BACKUP_DIR`
- **Description**: Directory for database backup storage
- **Default**: `/backups`
- **Example**: `/var/backups/crm`

#### `RETENTION_DAYS`
- **Description**: Number of days to retain backups
- **Default**: `30`
- **Recommendation**: 30-90 days

#### `POSTGRES_CONTAINER`
- **Description**: PostgreSQL Docker container name
- **Example**: `crm-postgres-prod`
- **Use**: For automated backup scripts

---

### AWS S3 Offsite Backup (Optional)

#### `S3_BUCKET`
- **Description**: AWS S3 bucket name for offsite backups
- **Example**: `my-company-crm-backups`

#### `S3_PREFIX`
- **Description**: S3 key prefix for organizing backups
- **Default**: `crm-backups`
- **Example**: `prod/backups`

#### `ENABLE_S3_UPLOAD`
- **Description**: Enable automatic S3 uploads
- **Values**: `true`, `false`
- **Default**: `false`

#### `AWS_ACCESS_KEY_ID`
- **Description**: AWS credentials (if not using IAM roles)
- **Security**: Prefer IAM roles over static credentials

#### `AWS_SECRET_ACCESS_KEY`
- **Description**: AWS secret key
- **Security**: Never commit to version control

#### `AWS_REGION`
- **Description**: AWS region for S3 bucket
- **Default**: `us-east-1`
- **Example**: `us-west-2`, `eu-central-1`

---

### Backup Notifications

#### `ENABLE_EMAIL_ALERTS`
- **Description**: Enable backup status email notifications
- **Values**: `true`, `false`
- **Default**: `false`

#### `ALERT_EMAIL`
- **Description**: Email address for backup alerts
- **Example**: `ops@yourcompany.com`

---

## Security Best Practices

### ✅ DO:
1. **Generate Strong Secrets**:
   ```bash
   # Generate JWT_SECRET
   openssl rand -base64 64
   
   # Generate database password
   openssl rand -base64 32
   ```

2. **Use Environment-Specific Files**:
   - `.env.development` (local dev - can commit template)
   - `.env.production` (never commit - use secrets manager)
   - `.env.test` (CI/CD only)

3. **Secrets Management**:
   - Production: Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
   - Never store production secrets in `.env` files in git
   - Rotate secrets regularly (JWT_SECRET every 90 days)

4. **Validate on Startup**:
   - Application validates all environment variables on startup
   - Fails fast if critical variables are missing or insecure

5. **Monitor Access**:
   - Enable audit logging for secrets access
   - Alert on failed authentication attempts

### ❌ DON'T:
1. **Never commit `.env` files** containing real credentials to version control
2. **Don't use default/example passwords** in production
3. **Don't share the same secrets** across environments
4. **Don't use weak passwords** (< 16 characters for database, < 64 for JWT in prod)
5. **Don't expose `.env` files** in Docker images or deployments

---

## Validation Rules

The application validates environment variables on startup:

### Development Mode (`NODE_ENV=development`)
- ✅ Allows weaker secrets (32+ chars for JWT)
- ⚠️ Warns about weak configurations
- ✅ Allows localhost database connections
- ⚠️ Optional: Sentry, Email, Redis password

### Production Mode (`NODE_ENV=production`)
- ❌ **Fails** if JWT_SECRET < 64 characters
- ❌ **Fails** if DATABASE_URL points to localhost
- ❌ **Fails** if SENTRY_DSN not set
- ❌ **Fails** if Email configuration incomplete
- ❌ **Fails** if secrets contain insecure patterns
- ⚠️ **Warns** if Redis password not set

---

## Examples

### Development (.env.development)
```bash
# Database
DATABASE_URL="postgresql://postgres:devpass@localhost:5432/crm_dev?schema=public"

# JWT (32+ chars OK for dev)
JWT_SECRET="dev_secret_key_minimum_32_characters_long_example"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Monitoring (optional in dev)
SENTRY_DSN=""
SENTRY_ENABLE_DEV=false

# Email (console logging in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### Production (.env.production - DO NOT COMMIT)
```bash
# Database (must be production host)
DATABASE_URL="postgresql://crm_prod_user:veryStrongPassword16Plus@prod-db.company.com:5432/crm_production?schema=public"

# JWT (64+ chars required)
JWT_SECRET="[REPLACE_WITH_OUTPUT_FROM: openssl rand -base64 64]"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://app.yourcompany.com

# Monitoring (REQUIRED)
SENTRY_DSN="https://[YOUR_KEY]@o[ORG_ID].ingest.sentry.io/[PROJECT_ID]"
SENTRY_RELEASE="crm-backend@1.0.0"
HOSTNAME="crm-backend-prod-01"

# Email (REQUIRED)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=[SENDGRID_API_KEY]
EMAIL_FROM=notifications@yourcompany.com

# Redis (password REQUIRED)
REDIS_HOST=redis.company.com
REDIS_PORT=6379
REDIS_PASSWORD=[STRONG_REDIS_PASSWORD]

# Backup
BACKUP_DIR=/var/backups/crm
RETENTION_DAYS=90
POSTGRES_CONTAINER=crm-postgres-prod

# S3 Offsite Backup (recommended)
S3_BUCKET=yourcompany-crm-backups
S3_PREFIX=production/backups
ENABLE_S3_UPLOAD=true
AWS_REGION=us-east-1
# Use IAM roles instead of access keys when possible

# Email Alerts
ENABLE_EMAIL_ALERTS=true
ALERT_EMAIL=ops@yourcompany.com
```

---

## Troubleshooting

### Application won't start
1. Check console output for specific missing variables
2. Verify `.env` file is in the correct location (`backend/.env`)
3. Ensure no syntax errors in `.env` file (no spaces around `=`)

### Validation warnings
- Review warnings and update configurations
- Warnings don't prevent startup but indicate potential issues

### Production deployment fails
1. Verify all production-required variables are set
2. Check JWT_SECRET is 64+ characters
3. Confirm DATABASE_URL doesn't point to localhost
4. Ensure SENTRY_DSN is configured

---

## References

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [Sentry Setup Guide](https://docs.sentry.io/platforms/node/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
