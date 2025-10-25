# Production Deployment Verification Script (PowerShell)
# Usage: .\pre-deploy-check.ps1

Write-Host "`n🔍 CRM Production Deployment Pre-Flight Check" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Check 1: .env.production exists
Write-Host "📋 Checking .env.production exists... " -NoNewline
if (Test-Path ".env.production") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "✗" -ForegroundColor Red
    Write-Host "   Create .env.production from .env.production.example" -ForegroundColor Yellow
    $Errors++
}

# Check 2: .env.production not in Git
Write-Host "🔒 Checking .env.production not tracked by Git... " -NoNewline
$gitTracked = git ls-files --error-unmatch .env.production 2>$null
if ($gitTracked) {
    Write-Host "✗ CRITICAL" -ForegroundColor Red
    Write-Host "   .env.production is tracked by Git! Remove it immediately:" -ForegroundColor Red
    Write-Host "   git rm --cached .env.production" -ForegroundColor Yellow
    $Errors++
} else {
    Write-Host "✓" -ForegroundColor Green
}

# Check 3: docker-compose.prod.yml exists
Write-Host "🐳 Checking docker-compose.prod.yml exists... " -NoNewline
if (Test-Path "docker-compose.prod.yml") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "✗" -ForegroundColor Red
    $Errors++
}

# Check 4: Production Dockerfile exists
Write-Host "🏗️  Checking backend/Dockerfile.prod exists... " -NoNewline
if (Test-Path "backend\Dockerfile.prod") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "✗" -ForegroundColor Red
    $Errors++
}

# Check 5: .dockerignore files exist
Write-Host "📦 Checking .dockerignore files... " -NoNewline
if ((Test-Path "backend\.dockerignore") -and (Test-Path "frontend\.dockerignore")) {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "⚠" -ForegroundColor Yellow
    $Warnings++
}

# Check 6: Check for hardcoded secrets in docker-compose.yml
Write-Host "🔑 Checking for hardcoded secrets in docker-compose.yml... " -NoNewline
$devCompose = Get-Content "docker-compose.yml" -Raw
if ($devCompose -match "POSTGRES_PASSWORD.*password" -or $devCompose -match "JWT_SECRET.*your-jwt-secret") {
    Write-Host "⚠ Found in dev config (OK)" -ForegroundColor Yellow
    $Warnings++
} else {
    Write-Host "✓" -ForegroundColor Green
}

# Check 7: Verify production config uses env_file
Write-Host "🔐 Checking docker-compose.prod.yml uses env_file... " -NoNewline
$prodCompose = Get-Content "docker-compose.prod.yml" -Raw
if ($prodCompose -match "env_file:") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "✗" -ForegroundColor Red
    $Errors++
}

# Check 8: Health endpoint exists
Write-Host "❤️  Checking health endpoint exists... " -NoNewline
if (Test-Path "backend\src\health\health.controller.ts") {
    Write-Host "✓" -ForegroundColor Green
} else {
    Write-Host "⚠" -ForegroundColor Yellow
    $Warnings++
}

# Check 9: Tests passing
Write-Host "🧪 Running test suite... " -NoNewline
Push-Location backend
npm test --silent > $null 2>&1
$testExitCode = $LASTEXITCODE
Pop-Location

if ($testExitCode -eq 0) {
    Write-Host "✓ All tests passing" -ForegroundColor Green
} else {
    Write-Host "✗ Tests failing" -ForegroundColor Red
    $Errors++
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Errors: $Errors" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host "   Warnings: $Warnings" -ForegroundColor $(if ($Warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($Errors -eq 0) {
    Write-Host "✅ READY FOR PRODUCTION DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Generate strong secrets in .env.production" -ForegroundColor White
    Write-Host "2. Update domain names (FRONTEND_URL, NEXT_PUBLIC_API_URL)" -ForegroundColor White
    Write-Host "3. Deploy: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ NOT READY - Fix errors above" -ForegroundColor Red
    exit 1
}
