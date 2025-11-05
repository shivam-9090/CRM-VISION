# GitHub Actions CI/CD Documentation

This directory contains the GitHub Actions workflows for automated testing, building, and deployment of the CRM system.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)

**Trigger:** On push to `main`/`develop` branches and pull requests

**Jobs:**
- **backend-test:** Run backend unit tests with PostgreSQL and Redis
- **frontend-test:** Run frontend tests and build
- **security-scan:** npm audit and Trivy vulnerability scanning
- **build-images:** Build and push Docker images to GitHub Container Registry
- **notify-failure:** Send notifications on pipeline failure

**Services:**
- PostgreSQL 15 (for database tests)
- Redis 7 (for caching tests)

**Outputs:**
- Test coverage reports (uploaded to Codecov)
- Docker images tagged with branch name and commit SHA
- Security scan results (uploaded to GitHub Security tab)

---

### 2. CD Pipeline (`deploy.yml`)

**Trigger:** 
- Push to `main` branch (staging)
- Git tags `v*.*.*` (production)
- Manual workflow dispatch

**Environments:**
- **Staging:** Auto-deploy from `main` branch
- **Production:** Deploy from tags or manual trigger

**Jobs:**
- **pre-deploy-checks:** Verify TODO comments, env vars, migrations
- **deploy-staging:** Deploy to Render staging environment
- **deploy-production:** Deploy to Render production environment
- **rollback:** Manual rollback to previous version
- **post-deploy:** Clear CDN cache, send notifications

**Required Secrets:**
- `RENDER_API_KEY`: Render API key for deployments
- `RENDER_SERVICE_ID_BACKEND_STAGING`: Staging backend service ID
- `RENDER_SERVICE_ID_FRONTEND_STAGING`: Staging frontend service ID
- `RENDER_SERVICE_ID_BACKEND_PRODUCTION`: Production backend service ID
- `RENDER_SERVICE_ID_FRONTEND_PRODUCTION`: Production frontend service ID
- `DATABASE_URL_STAGING`: Staging database connection string
- `DATABASE_URL_PRODUCTION`: Production database connection string
- `SENTRY_AUTH_TOKEN`: Sentry API token for release tracking
- `SENTRY_ORG`: Sentry organization name
- `SENTRY_PROJECT`: Sentry project name

---

### 3. Dependency Updates (`dependencies.yml`)

**Trigger:**
- Scheduled: Every Monday at 9 AM UTC
- Manual workflow dispatch

**Jobs:**
- **update-dependencies:** Check for outdated packages and security issues
- **auto-update-minor:** Auto-update minor versions and create PR (manual only)

**Features:**
- Runs `npm outdated` on backend and frontend
- Creates GitHub issues for security vulnerabilities
- Automated PR creation for minor dependency updates

---

## Setup Instructions

### 1. GitHub Repository Secrets

Add these secrets in **Settings > Secrets and variables > Actions**:

```bash
# Render Deployment
RENDER_API_KEY=your_render_api_key

# Staging Services
RENDER_SERVICE_ID_BACKEND_STAGING=srv-xxxxx
RENDER_SERVICE_ID_FRONTEND_STAGING=srv-xxxxx
DATABASE_URL_STAGING=postgresql://user:pass@host:5432/db

# Production Services
RENDER_SERVICE_ID_BACKEND_PRODUCTION=srv-xxxxx
RENDER_SERVICE_ID_FRONTEND_PRODUCTION=srv-xxxxx
DATABASE_URL_PRODUCTION=postgresql://user:pass@host:5432/db

# Monitoring
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your-org
SENTRY_PROJECT=crm-backend

# Optional: Codecov (for coverage reports)
CODECOV_TOKEN=your_codecov_token
```

### 2. Enable GitHub Container Registry

1. Go to **Settings > Actions > General**
2. Under "Workflow permissions", select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**

### 3. Configure Environments

Create two environments in **Settings > Environments**:

**Staging:**
- No protection rules
- Auto-deploy from `main` branch

**Production:**
- Add required reviewers (at least 1)
- Enable "Wait timer" (5 minutes recommended)
- Add deployment branch rule: Only `main` and tags `v*.*.*`

---

## Usage Examples

### Running CI Pipeline

```bash
# Push to main or develop
git push origin main

# Create pull request
gh pr create --base main --head feature-branch
```

### Deploying to Staging

```bash
# Automatic on push to main
git push origin main

# Or manual trigger
gh workflow run deploy.yml -f environment=staging
```

### Deploying to Production

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Or manual trigger
gh workflow run deploy.yml -f environment=production
```

### Rolling Back Deployment

```bash
# Manual trigger with environment selection
gh workflow run deploy.yml -f environment=production

# Select "Rollback Deployment" job
```

### Updating Dependencies

```bash
# Manual trigger for auto-update
gh workflow run dependencies.yml
```

---

## Workflow Features

### ✅ CI Pipeline Features

- **Parallel Execution:** Backend and frontend tests run in parallel
- **Service Containers:** PostgreSQL and Redis for integration tests
- **Coverage Reports:** Uploaded to Codecov for tracking
- **Security Scanning:** Trivy for container vulnerabilities
- **Docker Caching:** Uses GitHub Actions cache for faster builds
- **Lint Checks:** ESLint for both backend and frontend

### ✅ CD Pipeline Features

- **Multi-Environment:** Staging and production environments
- **Database Migrations:** Automatic Prisma migration deployment
- **Health Checks:** Verify services are running after deployment
- **Smoke Tests:** Basic API endpoint testing
- **Backup Before Deploy:** Automatic database backup (production)
- **Rollback Support:** Manual rollback to previous version
- **Release Tracking:** GitHub releases and Sentry integration

### ✅ Dependency Update Features

- **Scheduled Scans:** Weekly dependency checks
- **Security Alerts:** Auto-create issues for vulnerabilities
- **Auto-Update PRs:** Automated minor version updates
- **Audit Reports:** npm audit for both projects

---

## Monitoring and Notifications

### GitHub Actions Dashboard

View all workflow runs:
```
https://github.com/YOUR_USERNAME/CRM-VISION/actions
```

### Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/CRM-VISION/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/YOUR_USERNAME/CRM-VISION/actions/workflows/deploy.yml/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/CRM-VISION/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/CRM-VISION)
```

### Notifications

To enable Slack/Discord notifications:

1. Add webhook URL to repository secrets:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
   ```

2. Add notification step to workflows:
   ```yaml
   - name: Notify Slack
     uses: slackapi/slack-github-action@v1
     with:
       webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
       payload: |
         {
           "text": "Deployment to production completed ✅"
         }
   ```

---

## Troubleshooting

### Tests Failing in CI

**Issue:** Tests pass locally but fail in CI

**Solution:**
1. Check service container health (PostgreSQL, Redis)
2. Verify environment variables in workflow
3. Run `npm ci` instead of `npm install` locally
4. Check Node.js version matches CI (20.x)

### Docker Build Fails

**Issue:** Docker image build fails

**Solution:**
1. Check Dockerfile syntax
2. Verify build context is correct
3. Check for missing files in `.dockerignore`
4. Review build logs for specific errors

### Deployment Fails

**Issue:** Render deployment fails

**Solution:**
1. Verify Render API key is correct
2. Check service IDs are correct
3. Verify environment variables in Render dashboard
4. Review Render deployment logs

### Coverage Below Threshold

**Issue:** CI fails due to coverage < 60%

**Solution:**
1. Fix failing tests (see `backend/TEST_STATUS.md`)
2. Add missing mocks for SanitizerService, REDIS_CLIENT
3. Update auth.service.spec.ts with refresh token tests
4. Run locally: `npm test -- --coverage`

---

## Best Practices

### 1. Branch Strategy

- **main:** Production-ready code
- **develop:** Integration branch (optional)
- **feature/*:** Feature branches
- **hotfix/*:** Emergency fixes

### 2. Commit Messages

Follow Conventional Commits:
```
feat: add user authentication
fix: resolve login redirect issue
chore: update dependencies
docs: update README
test: add auth service tests
```

### 3. Pull Requests

- All PRs must pass CI checks
- Require at least 1 approval
- Run lint and tests locally before pushing
- Keep PRs small and focused

### 4. Versioning

Use Semantic Versioning (SemVer):
- **v1.0.0:** Major release
- **v1.1.0:** Minor feature addition
- **v1.1.1:** Patch/bugfix

### 5. Security

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Run `npm audit` before merging
- Review dependency updates carefully

---

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Implement canary deployments
- [ ] Add performance benchmarking
- [ ] Integrate with Datadog/New Relic
- [ ] Add automated rollback on health check failure
- [ ] Implement blue-green deployment strategy
- [ ] Add A/B testing infrastructure

---

## Support

For issues or questions about GitHub Actions:
1. Check workflow logs in Actions tab
2. Review this documentation
3. See `backend/TEST_STATUS.md` for test-specific issues
4. Create an issue in the repository
