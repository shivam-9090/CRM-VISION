# AWS Deployment Script for CRM System
# This script deploys your CRM to AWS Elastic Beanstalk

param(
    [string]$Region = "us-east-1",
    [string]$AppName = "crm-vision",
    [string]$EnvName = "crm-vision-prod"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Elastic Beanstalk Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command "eb" -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: EB CLI is not installed!" -ForegroundColor Yellow
    Write-Host "Installing EB CLI..." -ForegroundColor Yellow
    pip install awsebcli --upgrade --user
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Step 1: Configure AWS credentials (if not already done)
Write-Host "Step 1: Checking AWS credentials..." -ForegroundColor Yellow
$awsIdentity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "AWS credentials not configured!" -ForegroundColor Red
    Write-Host "Running 'aws configure'..." -ForegroundColor Yellow
    aws configure
} else {
    Write-Host "✓ AWS credentials configured" -ForegroundColor Green
}
Write-Host ""

# Step 2: Create ECR repositories
Write-Host "Step 2: Creating ECR repositories..." -ForegroundColor Yellow
$backendRepo = "${AppName}-backend"
$frontendRepo = "${AppName}-frontend"

aws ecr describe-repositories --repository-names $backendRepo --region $Region 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating backend ECR repository..." -ForegroundColor Yellow
    aws ecr create-repository --repository-name $backendRepo --region $Region
}

aws ecr describe-repositories --repository-names $frontendRepo --region $Region 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating frontend ECR repository..." -ForegroundColor Yellow
    aws ecr create-repository --repository-name $frontendRepo --region $Region
}

Write-Host "✓ ECR repositories ready" -ForegroundColor Green
Write-Host ""

# Step 3: Get ECR login
Write-Host "Step 3: Logging into ECR..." -ForegroundColor Yellow
$ecrUri = aws ecr describe-repositories --repository-names $backendRepo --region $Region --query 'repositories[0].repositoryUri' --output text
$ecrAccount = $ecrUri.Split('.')[0]
$ecrLogin = aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$ecrAccount.dkr.ecr.$Region.amazonaws.com"
Write-Host "✓ ECR login successful" -ForegroundColor Green
Write-Host ""

# Step 4: Build and push Docker images
Write-Host "Step 4: Building and pushing Docker images..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan

# Backend
Write-Host "Building backend..." -ForegroundColor Yellow
docker build -t $backendRepo -f backend/Dockerfile.prod backend/
docker tag "${backendRepo}:latest" "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${backendRepo}:latest"
docker push "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${backendRepo}:latest"

# Frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
docker build -t $frontendRepo -f frontend/Dockerfile frontend/
docker tag "${frontendRepo}:latest" "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${frontendRepo}:latest"
docker push "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${frontendRepo}:latest"

Write-Host "✓ Docker images pushed to ECR" -ForegroundColor Green
Write-Host ""

# Step 5: Update Dockerrun.aws.json with ECR URIs
Write-Host "Step 5: Updating Dockerrun.aws.json..." -ForegroundColor Yellow
$dockerrunPath = "Dockerrun.aws.json"
$dockerrunContent = Get-Content $dockerrunPath -Raw
$dockerrunContent = $dockerrunContent -replace 'YOUR_ECR_REPO/crm-backend:latest', "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${backendRepo}:latest"
$dockerrunContent = $dockerrunContent -replace 'YOUR_ECR_REPO/crm-frontend:latest', "$ecrAccount.dkr.ecr.$Region.amazonaws.com/${frontendRepo}:latest"
Set-Content -Path $dockerrunPath -Value $dockerrunContent
Write-Host "✓ Dockerrun.aws.json updated" -ForegroundColor Green
Write-Host ""

# Step 6: Initialize EB application
Write-Host "Step 6: Initializing Elastic Beanstalk..." -ForegroundColor Yellow
if (-not (Test-Path ".elasticbeanstalk")) {
    eb init $AppName --platform "Multi-container Docker" --region $Region
} else {
    Write-Host "EB already initialized" -ForegroundColor Cyan
}
Write-Host "✓ EB initialized" -ForegroundColor Green
Write-Host ""

# Step 7: Create environment (if not exists)
Write-Host "Step 7: Creating EB environment..." -ForegroundColor Yellow
$envExists = eb list 2>&1 | Select-String $EnvName
if (-not $envExists) {
    Write-Host "Creating new environment: $EnvName" -ForegroundColor Yellow
    eb create $EnvName --instance-type t3.medium --single
} else {
    Write-Host "Environment already exists" -ForegroundColor Cyan
}
Write-Host "✓ EB environment ready" -ForegroundColor Green
Write-Host ""

# Step 8: Deploy
Write-Host "Step 8: Deploying application..." -ForegroundColor Yellow
eb deploy $EnvName
Write-Host "✓ Deployment complete!" -ForegroundColor Green
Write-Host ""

# Step 9: Get environment URL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
$envUrl = eb status $EnvName | Select-String "CNAME:"
Write-Host "Your application is available at:" -ForegroundColor Yellow
Write-Host $envUrl -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables: eb setenv KEY=VALUE" -ForegroundColor Cyan
Write-Host "2. View logs: eb logs" -ForegroundColor Cyan
Write-Host "3. Open app: eb open" -ForegroundColor Cyan
Write-Host ""
