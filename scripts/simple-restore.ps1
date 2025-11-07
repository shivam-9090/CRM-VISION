# Simple Database Restore Script
# Usage: .\scripts\simple-restore.ps1 [backup_file]

param(
    [string]$BackupFile = "latest"
)

$BackupDir = ".\scripts\backups"

Write-Host "Database Restore Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Find container
$Container = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null | Select-Object -First 1

if (-not $Container) {
    Write-Host "ERROR: PostgreSQL container not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Container: $Container" -ForegroundColor Gray

# Find backup file
if ($BackupFile -eq "latest") {
    Write-Host "Finding latest backup..." -ForegroundColor Cyan
    $File = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $File) {
        Write-Host "ERROR: No backups found in $BackupDir" -ForegroundColor Red
        exit 1
    }
    $BackupPath = $File.FullName
    Write-Host "Latest backup: $($File.Name)" -ForegroundColor Gray
} else {
    $BackupPath = Join-Path $BackupDir $BackupFile
    if (-not (Test-Path $BackupPath)) {
        Write-Host "ERROR: Backup file not found: $BackupPath" -ForegroundColor Red
        exit 1
    }
}

# Confirm
Write-Host "`nWARNING: This will REPLACE the current database!" -ForegroundColor Yellow
$Confirm = Read-Host "Type 'yes' to continue"

if ($Confirm -ne "yes") {
    Write-Host "Restore cancelled" -ForegroundColor Yellow
    exit 0
}

# Restore
Write-Host "`nRestoring database..." -ForegroundColor Cyan

try {
    # Drop and recreate database
    docker exec $Container psql -U dev_user -c "DROP DATABASE IF EXISTS crm_dev;" 2>$null
    docker exec $Container psql -U dev_user -c "CREATE DATABASE crm_dev;"
    
    # Restore data
    Get-Content $BackupPath | docker exec -i $Container psql -U dev_user -d crm_dev
    
    Write-Host "SUCCESS: Database restored!" -ForegroundColor Green
    
    # Verify
    $TableCount = docker exec $Container psql -U dev_user -d crm_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    Write-Host "Tables restored: $($TableCount.Trim())" -ForegroundColor Gray
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
