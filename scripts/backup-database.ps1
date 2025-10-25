# Database Backup Script for CRM Production (PowerShell)
# This script creates automated PostgreSQL backups with retention policy

param(
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 30,
    [string]$PostgresContainer = "crm-postgres-prod"
)

# Configuration
$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "backup_$Date.sql.gz"
$LogFile = Join-Path $BackupDir "backup.log"

# Function to log messages
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

try {
    # Ensure backup directory exists
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    Write-Log "Starting database backup..."

    # Check if container is running
    $ContainerRunning = docker ps --filter "name=$PostgresContainer" --format "{{.Names}}"
    if (-not $ContainerRunning) {
        Write-Log "ERROR: PostgreSQL container '$PostgresContainer' is not running!"
        exit 1
    }

    # Get database credentials from environment
    $PostgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
    $PostgresDB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "crm" }

    # Create backup
    Write-Log "Creating backup: $BackupFile"
    $BackupPath = Join-Path $BackupDir $BackupFile
    
    docker exec $PostgresContainer pg_dump -U $PostgresUser $PostgresDB | Out-File -FilePath "$BackupPath.sql" -Encoding utf8
    
    # Compress backup (using 7-Zip if available, otherwise .NET compression)
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        7z a -tgzip "$BackupPath" "$BackupPath.sql" | Out-Null
        Remove-Item "$BackupPath.sql"
    } else {
        # Use .NET compression
        $SourceFile = "$BackupPath.sql"
        $DestFile = $BackupPath
        Add-Type -Assembly System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($SourceFile, $DestFile)
        Remove-Item "$BackupPath.sql"
    }

    $BackupSize = (Get-Item $BackupPath).Length / 1MB
    Write-Log "✅ Backup completed successfully: $BackupFile ($([math]::Round($BackupSize, 2)) MB)"

    # Clean up old backups
    Write-Log "Cleaning up backups older than $RetentionDays days..."
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
    
    if ($OldBackups.Count -gt 0) {
        $OldBackups | Remove-Item -Force
        Write-Log "Deleted $($OldBackups.Count) old backup(s)"
    } else {
        Write-Log "No old backups to delete"
    }

    # List current backups
    $TotalBackups = (Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz").Count
    $TotalSize = (Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Log "Current backups: $TotalBackups files, Total size: $([math]::Round($TotalSize, 2)) MB"

    Write-Log "Backup process completed successfully!"
    exit 0

} catch {
    Write-Log "❌ ERROR: $($_.Exception.Message)"
    exit 1
}
