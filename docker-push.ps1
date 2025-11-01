# ============================================
# Docker Build and Push Script for CRM-VISION
# ============================================
# This script builds and pushes Docker images to Docker Hub
# Usage: .\docker-push.ps1 -Username "your-dockerhub-username" -Version "1.0.0"

param(
    [Parameter(Mandatory=$false)]
    [string]$Username = "shivam9090",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest"
)

Write-Host "CRM-VISION Docker Build & Push Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`nChecking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Confirm username
Write-Host "`nDocker Hub Username: $Username" -ForegroundColor Cyan
Write-Host "Version Tag: $Version" -ForegroundColor Cyan
$confirm = Read-Host "`nIs this correct? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Aborted by user" -ForegroundColor Red
    exit 0
}

# Login to Docker Hub
Write-Host "`nLogging in to Docker Hub..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Successfully logged in to Docker Hub" -ForegroundColor Green

# Build Backend (Production)
Write-Host "`nBuilding Backend Image (Production)..." -ForegroundColor Yellow
docker build -t "$Username/crm-vision-backend:$Version" -f backend/Dockerfile.prod ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend image built successfully" -ForegroundColor Green

# Build Frontend (Production)
Write-Host "`nBuilding Frontend Image (Production)..." -ForegroundColor Yellow
docker build -t "$Username/crm-vision-frontend:$Version" -f frontend/Dockerfile ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend image built successfully" -ForegroundColor Green

# Tag as latest if version is not "latest"
if ($Version -ne "latest") {
    Write-Host "`nTagging images as 'latest'..." -ForegroundColor Yellow
    docker tag "$Username/crm-vision-backend:$Version" "$Username/crm-vision-backend:latest"
    docker tag "$Username/crm-vision-frontend:$Version" "$Username/crm-vision-frontend:latest"
    Write-Host "✅ Images tagged as 'latest'" -ForegroundColor Green
}

# Push Backend Image
Write-Host "`nPushing Backend Image to Docker Hub..." -ForegroundColor Yellow
docker push "$Username/crm-vision-backend:$Version"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend push failed" -ForegroundColor Red
    exit 1
}
if ($Version -ne "latest") {
    docker push "$Username/crm-vision-backend:latest"
}
Write-Host "✅ Backend image pushed successfully" -ForegroundColor Green

# Push Frontend Image
Write-Host "`nPushing Frontend Image to Docker Hub..." -ForegroundColor Yellow
docker push "$Username/crm-vision-frontend:$Version"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend push failed" -ForegroundColor Red
    exit 1
}
if ($Version -ne "latest") {
    docker push "$Username/crm-vision-frontend:latest"
}
Write-Host "✅ Frontend image pushed successfully" -ForegroundColor Green

# Summary
Write-Host "`nDocker Images Published Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Backend: $Username/crm-vision-backend:$Version" -ForegroundColor Cyan
Write-Host "Frontend: $Username/crm-vision-frontend:$Version" -ForegroundColor Cyan
if ($Version -ne "latest") {
    Write-Host "`nAlso tagged as:" -ForegroundColor Yellow
    Write-Host "Backend: $Username/crm-vision-backend:latest" -ForegroundColor Cyan
    Write-Host "Frontend: $Username/crm-vision-frontend:latest" -ForegroundColor Cyan
}
Write-Host "`nView on Docker Hub:" -ForegroundColor Yellow
Write-Host "https://hub.docker.com/r/$Username/crm-vision-backend" -ForegroundColor Blue
Write-Host "https://hub.docker.com/r/$Username/crm-vision-frontend" -ForegroundColor Blue
