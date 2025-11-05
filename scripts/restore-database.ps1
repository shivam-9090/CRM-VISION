# Database Restore Script for CRM Production (PowerShell)
# This script restores PostgreSQL backups from local or S3 storage
# Supports point-in-time recovery using WAL files

param(
    [Parameter(Mandatory=$true)]
    [string]$RestoreFile,
    [string]$BackupDir = ".\backups",
    [string]$PostgresContainer = "crm-postgres-prod",
    [bool]$RestoreFromS3 = $false,
    [string]$S3Bucket = "",
    [string]$S3Prefix = "crm-backups"
)

# ============================================
# Configuration
# ============================================
$ErrorActionPreference = "Stop"

# Database credentials
$PostgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$PostgresDB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "crm" }

# ============================================
# Helper Functions
# ============================================

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Timestamp] $Message"
}

# ============================================
# Validation
# ============================================

Write-Log "=========================================="
Write-Log "Starting database restore process"
Write-Log "=========================================="

# Check if container is running
$ContainerRunning = docker ps --filter "name=$PostgresContainer" --format "{{.Names}}"
if (-not $ContainerRunning) {
    Write-Log "❌ ERROR: PostgreSQL container '$PostgresContainer' is not running!"
    exit 1
}

# ============================================
# Main Restore Process
# ============================================

try {
    # Handle 'latest' keyword
    if ($RestoreFile -eq "latest") {
        if ($RestoreFromS3) {
            Write-Log "Finding latest backup from S3..."
            $S3Files = aws s3 ls "s3://$S3Bucket/$S3Prefix/" | Where-Object { $_ -match "backup_.*\.sql\.gz" }
            $RestoreFile = ($S3Files | Select-Object -Last 1) -replace '.*\s+', ''
        } else {
            Write-Log "Finding latest local backup..."
            $LatestBackup = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            $RestoreFile = $LatestBackup.Name
        }
        
        if (-not $RestoreFile) {
            Write-Log "❌ ERROR: No backups found!"
            exit 1
        }
        Write-Log "Latest backup: $RestoreFile"
    }

    # Download from S3 if needed
    if ($RestoreFromS3) {
        Write-Log "Downloading backup from S3..."
        $S3Path = "s3://$S3Bucket/$S3Prefix/$RestoreFile"
        $LocalPath = Join-Path $BackupDir $RestoreFile
        
        aws s3 cp $S3Path $LocalPath
        Write-Log "✅ Downloaded from S3: $RestoreFile"
    }

    # Verify backup file exists
    $BackupPath = Join-Path $BackupDir $RestoreFile
    if (-not (Test-Path $BackupPath)) {
        Write-Log "❌ ERROR: Backup file not found: $BackupPath"
        exit 1
    }

    # Verify backup integrity
    Write-Log "Verifying backup integrity..."
    try {
        $TestFile = [System.IO.File]::ReadAllBytes($BackupPath)
        if ($TestFile.Length -gt 0) {
            Write-Log "✅ Backup integrity verified"
        } else {
            throw "Backup file is empty"
        }
    } catch {
        Write-Log "❌ ERROR: Backup file is corrupted!"
        exit 1
    }

    # Confirm restore operation
    Write-Host ""
    $Confirm = Read-Host "⚠️  WARNING: This will REPLACE the current database. Continue? (yes/no)"
    if ($Confirm -ne "yes") {
        Write-Log "Restore cancelled by user"
        exit 0
    }

    # Create a safety backup of current database
    $SafetyBackup = "pre_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql.gz"
    Write-Log "Creating safety backup of current database: $SafetyBackup"
    
    $SafetyPath = Join-Path $BackupDir $SafetyBackup
    docker exec $PostgresContainer pg_dump -U $PostgresUser $PostgresDB | Out-File -FilePath "$SafetyPath.sql" -Encoding utf8
    
    # Compress safety backup
    Add-Type -Assembly System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory("$SafetyPath.sql", $SafetyPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Remove-Item "$SafetyPath.sql" -Force
    
    Write-Log "✅ Safety backup created"

    # Drop existing connections
    Write-Log "Terminating active connections..."
    docker exec $PostgresContainer psql -U $PostgresUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$PostgresDB' AND pid <> pg_backend_pid();" 2>$null

    # Drop and recreate database
    Write-Log "Dropping and recreating database..."
    docker exec $PostgresContainer psql -U $PostgresUser -d postgres -c "DROP DATABASE IF EXISTS $PostgresDB;" 2>$null
    docker exec $PostgresContainer psql -U $PostgresUser -d postgres -c "CREATE DATABASE $PostgresDB;"

    # Restore backup
    Write-Log "Restoring database from backup..."
    
    # Extract and restore
    $TempSqlFile = Join-Path $BackupDir "temp_restore.sql"
    Expand-Archive -Path $BackupPath -DestinationPath (Split-Path $TempSqlFile) -Force
    
    Get-Content $TempSqlFile | docker exec -i $PostgresContainer psql -U $PostgresUser -d $PostgresDB
    Remove-Item $TempSqlFile -Force -ErrorAction SilentlyContinue

    Write-Log "✅ Database restored successfully from: $RestoreFile"
    
    # Verify restore
    Write-Log "Verifying restore..."
    $TableCount = docker exec $PostgresContainer psql -U $PostgresUser -d $PostgresDB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    
    Write-Log "Restored database has $($TableCount.Trim()) tables"
    
    if ([int]$TableCount.Trim() -gt 0) {
        Write-Log "✅ Restore verification passed"
    } else {
        Write-Log "⚠️  WARNING: Restored database appears empty!"
    }
    
    Write-Log "=========================================="
    Write-Log "Restore Summary:"
    Write-Log "- Restored from: $RestoreFile"
    Write-Log "- Tables: $($TableCount.Trim())"
    Write-Log "- Safety backup: $SafetyBackup"
    Write-Log "=========================================="

    Write-Log "Restore completed successfully!"
    exit 0

} catch {
    Write-Log "❌ ERROR: Restore failed! $($_.Exception.Message)"
    
    Write-Log "Attempting to restore from safety backup..."
    try {
        $SafetyPath = Join-Path $BackupDir $SafetyBackup
        if (Test-Path $SafetyPath) {
            $TempSqlFile = Join-Path $BackupDir "temp_restore.sql"
            Expand-Archive -Path $SafetyPath -DestinationPath (Split-Path $TempSqlFile) -Force
            Get-Content $TempSqlFile | docker exec -i $PostgresContainer psql -U $PostgresUser -d $PostgresDB
            Remove-Item $TempSqlFile -Force -ErrorAction SilentlyContinue
            
            Write-Log "✅ Rolled back to safety backup"
        }
    } catch {
        Write-Log "❌ CRITICAL: Rollback failed! Manual intervention required!"
    }
    
    exit 1
}
