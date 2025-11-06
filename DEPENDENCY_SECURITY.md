# Dependency Security Scanning Documentation

## 🎯 Overview

This document describes the comprehensive dependency security scanning strategy implemented for the CRM system. The strategy includes automated vulnerability detection, license compliance checking, and dependency updates.

## 🔧 Tools & Services

### 1. **Dependabot** (Automated Dependency Updates)
- **Status**: ✅ Configured
- **Configuration**: `.github/dependabot.yml`
- **Features**:
  - Weekly automated dependency updates (Mondays at 9 AM UTC)
  - Separate tracking for backend, frontend, Docker, and GitHub Actions
  - Grouped minor/patch updates to reduce PR noise
  - Automatic security updates prioritization
  - Major version updates require manual review

**Configuration Details**:
```yaml
# Updates checked weekly for:
- Backend npm packages
- Frontend npm packages  
- Docker base images
- GitHub Actions
```

### 2. **npm audit** (Built-in Vulnerability Scanner)
- **Status**: ✅ Configured
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - Runs on every push, PR, and daily at 2 AM UTC
  - Fails builds on HIGH or CRITICAL vulnerabilities
  - Separate scans for backend and frontend
  - JSON reports uploaded as artifacts (30-day retention)

**Severity Thresholds**:
- ✅ **Pass**: Low, Moderate vulnerabilities
- ❌ **Fail**: High, Critical vulnerabilities

### 3. **Trivy** (Container & Filesystem Scanner)
- **Status**: ✅ Configured
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - File system scanning (backend/frontend dependencies)
  - Docker image scanning (production images)
  - SARIF format results uploaded to GitHub Security tab
  - Ignores unfixed vulnerabilities to reduce noise

**Scan Types**:
- **Filesystem**: Scans `package.json`, `package-lock.json`, and dependencies
- **Docker Image**: Scans built Docker images for OS and app vulnerabilities

### 4. **Snyk** (Enterprise-Grade Security Scanner)
- **Status**: ⚙️ Optional (requires SNYK_TOKEN secret)
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - Deep dependency tree analysis
  - Fix recommendations and automated PRs
  - Docker image scanning
  - License compliance checking
  - Vulnerability database updates in real-time

**Setup Instructions**:
1. Sign up at [https://snyk.io](https://snyk.io)
2. Generate API token
3. Add `SNYK_TOKEN` to GitHub Secrets
4. Workflow will automatically enable Snyk scans

### 5. **OSS Gadget** (Microsoft OSS Scanner)
- **Status**: ✅ Configured
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - Backdoor detection in dependencies
  - Typosquatting detection (malicious package names)
  - Microsoft's open-source security tool

**Scans**:
- `oss-detect-backdoor`: Detects malicious code patterns
- `oss-find-squats`: Detects typosquatting attacks

### 6. **License Checker** (Compliance Verification)
- **Status**: ✅ Configured
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - Detects all dependency licenses
  - Fails on forbidden licenses (GPL, AGPL)
  - Generates license summary reports
  - 90-day artifact retention

**Forbidden Licenses**:
- GPL-2.0, GPL-3.0
- AGPL-1.0, AGPL-3.0
- (Can be customized in workflow)

### 7. **Dependency Review** (GitHub Native)
- **Status**: ✅ Configured
- **Workflow**: `.github/workflows/security-scan.yml`
- **Features**:
  - Runs only on Pull Requests
  - Compares dependencies with base branch
  - Comments summary directly in PR
  - Blocks merging on high severity issues

## 📊 Security Workflow Triggers

### Automated Scans:
1. **On Push** (main, develop, features branches)
2. **On Pull Request** (main, develop, features branches)
3. **Daily Schedule** (2 AM UTC)
4. **Manual Trigger** (`workflow_dispatch`)

### Dependabot:
1. **Weekly Schedule** (Mondays at 9 AM UTC)
2. **Security Updates** (Immediate when vulnerabilities detected)

## 🚨 Failure Handling

### Build Failures:
When HIGH or CRITICAL vulnerabilities are detected:

1. **CI Build Fails** ❌
2. **GitHub Issue Created** automatically with:
   - Vulnerability details
   - Severity levels
   - Action items
   - Labels: `security`, `critical`, `dependencies`

3. **Deployment Blocked** until resolved

### Resolution Steps:
```bash
# Backend
cd backend
npm audit fix              # Auto-fix compatible updates
npm audit fix --force      # Force major version updates (review changes!)
npm audit                  # Verify fixes

# Frontend  
cd frontend
npm audit fix
npm audit
```

## 📈 Monitoring & Reporting

### GitHub Security Tab:
- All SARIF results uploaded automatically
- Trivy scan results
- Dependency review results
- Historical vulnerability tracking

### Artifacts:
- **npm audit results**: JSON format, 30-day retention
- **License reports**: Text format, 90-day retention
- Downloadable from workflow runs

### Notifications:
- Automatic GitHub Issues on critical failures
- Assignees: Repository maintainers
- Labels: `security`, `critical`, `dependencies`

## 🔐 Best Practices

### 1. **Regular Updates**
- Review Dependabot PRs weekly
- Don't ignore minor/patch updates
- Test updates in development before merging

### 2. **Vulnerability Response**
- **Critical**: Fix within 24 hours
- **High**: Fix within 1 week
- **Moderate**: Fix in next sprint
- **Low**: Fix when convenient

### 3. **Manual Review Required**
- Major version updates (Dependabot ignores these)
- License changes
- Breaking changes in dependencies

### 4. **False Positives**
- Document in `.github/.trivyignore` or Snyk policy
- Add justification comments
- Re-evaluate quarterly

### 5. **Security Advisories**
- Subscribe to GitHub Security Advisories
- Monitor npm security feed
- Review CVE databases for critical packages

## 📋 Security Checklist

### Before Merging PRs:
- [ ] All security scans passed
- [ ] No HIGH/CRITICAL vulnerabilities introduced
- [ ] License compliance verified
- [ ] Dependency review approved

### Monthly Review:
- [ ] Review all open Dependabot PRs
- [ ] Check Security tab for unresolved issues
- [ ] Update forbidden license list if needed
- [ ] Review OSS Gadget warnings

### Quarterly Audit:
- [ ] Review all dependencies for outdated versions
- [ ] Check for deprecated packages
- [ ] Audit license compliance
- [ ] Update security policies

## 🛠️ Troubleshooting

### Snyk Not Running?
- Verify `SNYK_TOKEN` secret is set
- Check Snyk account quota
- Review workflow logs for authentication errors

### Trivy False Positives?
Create `.trivyignore` file:
```
# Temporary ignore (with justification)
CVE-2024-12345 # Fixed in next release, no workaround available
```

### npm audit Fails on Dev Dependencies?
```bash
# Audit only production dependencies
npm audit --production

# Or update package-lock.json
rm package-lock.json
npm install
```

### License Compliance Failure?
1. Check `license-reports` artifact
2. Identify forbidden licenses
3. Find alternative packages
4. Update dependencies

## 📚 Resources

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Trivy Documentation](https://aquasecurity.github.io/trivy)
- [Snyk Documentation](https://docs.snyk.io)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OSS Gadget](https://github.com/microsoft/OSSGadget)

## 🎯 Success Metrics

### Current Status:
- ✅ Dependabot: Active (5 package ecosystems)
- ✅ npm audit: Enforced (fail on HIGH+)
- ✅ Trivy: Active (filesystem + Docker)
- ⚙️ Snyk: Optional (requires token)
- ✅ OSS Gadget: Active
- ✅ License Checker: Active
- ✅ Dependency Review: Active (PRs only)

### Goals:
- 🎯 Zero HIGH/CRITICAL vulnerabilities in production
- 🎯 100% license compliance
- 🎯 <7 days average vulnerability resolution time
- 🎯 Weekly dependency update reviews

---

**Last Updated**: November 6, 2025  
**Status**: ✅ Task #10 Complete  
**Next Review**: December 2025
