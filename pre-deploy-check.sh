#!/bin/bash
# Production Deployment Verification Script

echo "🔍 CRM Production Deployment Pre-Flight Check"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: .env.production exists
echo -n "📋 Checking .env.production exists... "
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Create .env.production from .env.production.example"
    ERRORS=$((ERRORS+1))
fi

# Check 2: .env.production not in Git
echo -n "🔒 Checking .env.production not tracked by Git... "
if git ls-files --error-unmatch .env.production 2>/dev/null; then
    echo -e "${RED}✗ CRITICAL${NC}"
    echo "   .env.production is tracked by Git! Remove it immediately:"
    echo "   git rm --cached .env.production"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓${NC}"
fi

# Check 3: docker-compose.prod.yml exists
echo -n "🐳 Checking docker-compose.prod.yml exists... "
if [ -f "docker-compose.prod.yml" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check 4: Production Dockerfile exists
echo -n "🏗️  Checking backend/Dockerfile.prod exists... "
if [ -f "backend/Dockerfile.prod" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check 5: .dockerignore files exist
echo -n "📦 Checking .dockerignore files... "
if [ -f "backend/.dockerignore" ] && [ -f "frontend/.dockerignore" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check 6: Check for hardcoded secrets in docker-compose.yml
echo -n "🔑 Checking for hardcoded secrets in docker-compose.yml... "
if grep -q "POSTGRES_PASSWORD: password" docker-compose.yml || grep -q "JWT_SECRET: your-jwt-secret" docker-compose.yml; then
    echo -e "${YELLOW}⚠ Found in dev config (OK)${NC}"
    WARNINGS=$((WARNINGS+1))
else
    echo -e "${GREEN}✓${NC}"
fi

# Check 7: Verify production config uses env_file
echo -n "🔐 Checking docker-compose.prod.yml uses env_file... "
if grep -q "env_file:" docker-compose.prod.yml; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check 8: Health endpoint exists
echo -n "❤️  Checking health endpoint exists... "
if [ -f "backend/src/health/health.controller.ts" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check 9: Tests passing
echo -n "🧪 Running test suite... "
cd backend
npm test --silent > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passing${NC}"
else
    echo -e "${RED}✗ Tests failing${NC}"
    ERRORS=$((ERRORS+1))
fi
cd ..

echo ""
echo "=============================================="
echo "📊 Summary:"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ READY FOR PRODUCTION DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Generate strong secrets in .env.production"
    echo "2. Update domain names (FRONTEND_URL, NEXT_PUBLIC_API_URL)"
    echo "3. Deploy: docker-compose -f docker-compose.prod.yml up -d"
    exit 0
else
    echo -e "${RED}❌ NOT READY - Fix errors above${NC}"
    exit 1
fi
