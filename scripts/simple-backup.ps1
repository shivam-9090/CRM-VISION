# Simple Database Backup Script
# Usage: .\scripts\simple-backup.ps1

$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = ".\scripts\backups"
$BackupFile = "backup_$Date.sql"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created backup directory: $BackupDir" -ForegroundColor Green
}

Write-Host "Starting database backup..." -ForegroundColor Cyan

# Check if Docker container is running
$ContainerName = "crm-postgres-1"
$Container = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null | Select-Object -First 1

if (-not $Container) {
    Write-Host "ERROR: PostgreSQL container not found!" -ForegroundColor Red
    Write-Host "Looking for containers with 'postgres' in name..." -ForegroundColor Yellow
    docker ps --format "{{.Names}}"
    exit 1
}

Write-Host "Using container: $Container" -ForegroundColor Gray

# Create backup
Write-Host "Creating backup: $BackupFile" -ForegroundColor Cyan

try {
    $BackupPath = Join-Path $BackupDir $BackupFile
    docker exec $Container pg_dump -U dev_user crm_dev > $BackupPath
    
    if (Test-Path $BackupPath) {
        $Size = (Get-Item $BackupPath).Length / 1MB
        Write-Host "SUCCESS: Backup created!" -ForegroundColor Green
        Write-Host "Location: $BackupPath" -ForegroundColor Gray
        Write-Host "Size: $([math]::Round($Size, 2)) MB" -ForegroundColor Gray
        
        # Count backups
        $TotalBackups = (Get-ChildItem -Path $BackupDir -Filter "backup_*.sql").Count
        Write-Host "Total backups: $TotalBackups" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Backup file was not created!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Cleanup old backups (keep last 10)
Write-Host "`nCleaning up old backups (keeping last 10)..." -ForegroundColor Cyan
$AllBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | Sort-Object LastWriteTime -Descending
if ($AllBackups.Count -gt 10) {
    $ToDelete = $AllBackups | Select-Object -Skip 10
    foreach ($file in $ToDelete) {
        Remove-Item $file.FullName -Force
        Write-Host "Deleted: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`nBackup complete!" -ForegroundColor Green
