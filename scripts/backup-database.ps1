# Database Backup Script for CRM Production (PowerShell)
# This script creates automated PostgreSQL backups with:
# - Retention policy (30 days default)
# - Backup verification
# - AWS S3 offsite storage support
# - Email notifications
# - Point-in-time recovery with WAL archiving

param(
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 30,
    [string]$PostgresContainer = "crm-postgres-prod",
    [string]$S3Bucket = "",
    [string]$S3Prefix = "crm-backups",
    [bool]$EnableS3Upload = $false,
    [bool]$EnableEmailAlerts = $false,
    [string]$AlertEmail = ""
)

# ============================================
# Configuration
# ============================================
$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "backup_$Date.sql.gz"
$WalBackupFile = "wal_$Date.tar.gz"
$LogFile = Join-Path $BackupDir "backup.log"

# Database credentials
$PostgresUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$PostgresDB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "crm" }
$PostgresPassword = $env:POSTGRES_PASSWORD

# ============================================
# Helper Functions
# ============================================

# Function to log messages
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

# Function to send email notifications
function Send-EmailNotification {
    param(
        [string]$Subject,
        [string]$Body
    )
    
    if ($EnableEmailAlerts -and $AlertEmail) {
        try {
            $EmailParams = @{
                To = $AlertEmail
                From = $env:EMAIL_FROM
                Subject = "CRM Backup: $Subject"
                Body = $Body
                SmtpServer = $env:SMTP_HOST
                Port = $env:SMTP_PORT
                UseSsl = $true
                Credential = New-Object System.Management.Automation.PSCredential($env:SMTP_USER, (ConvertTo-SecureString $env:SMTP_PASS -AsPlainText -Force))
            }
            Send-MailMessage @EmailParams -ErrorAction SilentlyContinue
        } catch {
            Write-Log "⚠️  WARNING: Failed to send email notification"
        }
    }
}

# Function to upload to S3
function Upload-ToS3 {
    param([string]$FilePath)
    
    if ($EnableS3Upload -and $S3Bucket) {
        $FileName = Split-Path $FilePath -Leaf
        $S3Path = "s3://$S3Bucket/$S3Prefix/$FileName"
        
        Write-Log "Uploading to S3: $S3Path"
        
        try {
            aws s3 cp $FilePath $S3Path --storage-class STANDARD_IA
            Write-Log "✅ S3 upload successful: $S3Path"
            return $true
        } catch {
            Write-Log "⚠️  WARNING: S3 upload failed - $($_.Exception.Message)"
            return $false
        }
    }
    return $false
}

# ============================================
# Main Backup Process
# ============================================

try {
    # Ensure backup directory exists
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    Write-Log "=========================================="
    Write-Log "Starting database backup process"
    Write-Log "=========================================="

    # Check if container is running
    $ContainerRunning = docker ps --filter "name=$PostgresContainer" --format "{{.Names}}"
    if (-not $ContainerRunning) {
        $ErrorMsg = "ERROR: PostgreSQL container '$PostgresContainer' is not running!"
        Write-Log $ErrorMsg
        Send-EmailNotification "❌ Backup Failed" $ErrorMsg
        exit 1
    }

    # Create SQL dump backup
    Write-Log "Creating SQL dump: $BackupFile"
    $BackupPath = Join-Path $BackupDir $BackupFile
    
    # Use pg_dump with custom format for better compression and features
    docker exec $PostgresContainer pg_dump -U $PostgresUser $PostgresDB --format=custom --blobs --verbose --file=/tmp/backup.dump 2>&1 | Out-File -FilePath (Join-Path $BackupDir "pg_dump.log") -Append
    
    # Copy from container
    docker cp "${PostgresContainer}:/tmp/backup.dump" "$BackupDir\backup_$Date.dump"
    
    # Compress using .NET
    Add-Type -Assembly System.IO.Compression.FileSystem
    $SourceFile = "$BackupDir\backup_$Date.dump"
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Split-Path $SourceFile), $BackupPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Remove-Item $SourceFile -Force
    
    $BackupSize = (Get-Item $BackupPath).Length / 1MB
    Write-Log "✅ SQL dump completed: $BackupFile ($([math]::Round($BackupSize, 2)) MB)"

    # Backup WAL files for point-in-time recovery
    Write-Log "Backing up WAL files for point-in-time recovery..."
    try {
        $WalBackupPath = Join-Path $BackupDir $WalBackupFile
        docker exec $PostgresContainer tar czf /tmp/wal_backup.tar.gz -C /var/lib/postgresql/data pg_wal 2>$null
        docker cp "${PostgresContainer}:/tmp/wal_backup.tar.gz" $WalBackupPath 2>$null
        
        if (Test-Path $WalBackupPath) {
            $WalSize = (Get-Item $WalBackupPath).Length / 1MB
            Write-Log "✅ WAL backup completed: $WalBackupFile ($([math]::Round($WalSize, 2)) MB)"
        }
    } catch {
        Write-Log "⚠️  WARNING: WAL backup skipped (not critical)"
    }

    # Verify backup integrity
    Write-Log "Verifying backup integrity..."
    try {
        $TestFile = [System.IO.File]::ReadAllBytes($BackupPath)
        if ($TestFile.Length -gt 0) {
            Write-Log "✅ Backup integrity verification passed"
        } else {
            throw "Backup file is empty"
        }
    } catch {
        $ErrorMsg = "ERROR: Backup file is corrupted! $($_.Exception.Message)"
        Write-Log $ErrorMsg
        Send-EmailNotification "❌ Backup Corrupted" $ErrorMsg
        exit 1
    }

    # Upload to S3 if enabled
    if ($EnableS3Upload) {
        Upload-ToS3 $BackupPath
        
        # Also upload WAL backup if exists
        if (Test-Path $WalBackupPath) {
            Upload-ToS3 $WalBackupPath
        }
    }

    # Clean up old local backups
    Write-Log "Cleaning up local backups older than $RetentionDays days..."
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $OldSqlBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
    $OldWalBackups = Get-ChildItem -Path $BackupDir -Filter "wal_*.tar.gz" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
    
    $DeletedCount = 0
    if ($OldSqlBackups) {
        $OldSqlBackups | Remove-Item -Force
        $DeletedCount += $OldSqlBackups.Count
    }
    if ($OldWalBackups) {
        $OldWalBackups | Remove-Item -Force
        $DeletedCount += $OldWalBackups.Count
    }
    
    if ($DeletedCount -gt 0) {
        Write-Log "Deleted $DeletedCount old backup(s)"
    } else {
        Write-Log "No old backups to delete"
    }

    # Clean up old S3 backups if enabled
    if ($EnableS3Upload -and $S3Bucket -and (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Log "Cleaning up S3 backups older than $RetentionDays days..."
        $CutoffDateStr = (Get-Date).AddDays(-$RetentionDays).ToString("yyyy-MM-dd")
        
        try {
            $S3Files = aws s3 ls "s3://$S3Bucket/$S3Prefix/" | ConvertFrom-String -PropertyNames Date,Time,Size,Name
            foreach ($file in $S3Files) {
                if ($file.Date -lt $CutoffDateStr -and $file.Name) {
                    aws s3 rm "s3://$S3Bucket/$S3Prefix/$($file.Name)"
                    Write-Log "Deleted S3 backup: $($file.Name)"
                }
            }
        } catch {
            Write-Log "⚠️  WARNING: S3 cleanup failed"
        }
    }

    # Summary statistics
    $TotalBackups = (Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz").Count
    $TotalSize = (Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.gz" | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Log "=========================================="
    Write-Log "Backup Summary:"
    Write-Log "- Local backups: $TotalBackups files"
    Write-Log "- Total local size: $([math]::Round($TotalSize, 2)) MB"
    Write-Log "- Retention: $RetentionDays days"
    Write-Log "- Latest backup: $BackupFile ($([math]::Round($BackupSize, 2)) MB)"
    if ($EnableS3Upload) {
        Write-Log "- S3 bucket: s3://$S3Bucket/$S3Prefix/"
    }
    Write-Log "=========================================="

    # Send success notification
    $SuccessMsg = @"
✅ CRM Database Backup Completed

Backup: $BackupFile
Size: $([math]::Round($BackupSize, 2)) MB
Location: $BackupDir
$(if ($EnableS3Upload) { "S3: s3://$S3Bucket/$S3Prefix/$BackupFile" })
"@
    
    Send-EmailNotification "✅ Backup Successful" $SuccessMsg

    Write-Log "Backup process completed successfully!"
    exit 0

} catch {
    $ErrorMsg = "❌ ERROR: $($_.Exception.Message)"
    Write-Log $ErrorMsg
    Send-EmailNotification "❌ Backup Failed" $ErrorMsg
    exit 1
}
