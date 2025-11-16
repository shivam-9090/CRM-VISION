# Quick AWS Deployment Setup
# Run this first before deploying

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Prerequisites Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "Step 1: Installing AWS CLI..." -ForegroundColor Yellow
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Host "Downloading AWS CLI installer..." -ForegroundColor Yellow
    $awsCliUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    Invoke-WebRequest -Uri $awsCliUrl -OutFile $installerPath
    
    Write-Host "Installing AWS CLI..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i $installerPath /quiet" -Wait
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Host "✓ AWS CLI installed" -ForegroundColor Green
} else {
    Write-Host "✓ AWS CLI already installed" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 2: Installing EB CLI..." -ForegroundColor Yellow
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Python is required for EB CLI!" -ForegroundColor Red
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command "eb" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing EB CLI via pip..." -ForegroundColor Yellow
    pip install awsebcli --upgrade --user
    
    # Add to PATH
    $pythonScripts = "$env:APPDATA\Python\Python*\Scripts"
    $env:Path += ";$pythonScripts"
    
    Write-Host "✓ EB CLI installed" -ForegroundColor Green
} else {
    Write-Host "✓ EB CLI already installed" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 3: Installing Docker Desktop..." -ForegroundColor Yellow
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Desktop is not installed!" -ForegroundColor Red
    Write-Host "Please download and install from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "After installation, restart your computer and run this script again." -ForegroundColor Yellow
} else {
    Write-Host "✓ Docker Desktop already installed" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 4: Configuring AWS credentials..." -ForegroundColor Yellow
Write-Host "You'll need your AWS Access Key ID and Secret Access Key" -ForegroundColor Cyan
Write-Host "Get them from: https://console.aws.amazon.com/iam/home#/security_credentials" -ForegroundColor Cyan
Write-Host ""
aws configure
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.aws with your configuration" -ForegroundColor Cyan
Write-Host "2. Run: .\scripts\deploy-aws.ps1" -ForegroundColor Cyan
Write-Host ""
