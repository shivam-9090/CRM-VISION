# Setup Windows Task Scheduler for automated backups
# This script configures daily automated backups using Windows Task Scheduler

param(
    [string]$BackupTime = "02:00",  # Default: 2 AM daily
    [string]$TaskName = "CRM-Database-Backup",
    [string]$BackupDir = ".\backups"
)

# ============================================
# Configuration
# ============================================
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupScript = Join-Path $ScriptDir "backup-database.ps1"

# ============================================
# Helper Functions
# ============================================

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Timestamp] $Message"
}

# ============================================
# Main Setup Process
# ============================================

Write-Log "=========================================="
Write-Log "Setting up Windows Task Scheduler backup job"
Write-Log "=========================================="

# Verify backup script exists
if (-not (Test-Path $BackupScript)) {
    Write-Log "❌ ERROR: Backup script not found: $BackupScript"
    exit 1
}

Write-Log "✅ Backup script found: $BackupScript"

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}
Write-Log "✅ Backup directory: $BackupDir"

# Parse backup time
$Hour, $Minute = $BackupTime -split ':'

# Remove existing task if it exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Log "Removing existing task..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create scheduled task action
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`" -BackupDir `"$BackupDir`""

# Create scheduled task trigger (daily at specified time)
$Trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime

# Create scheduled task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Create scheduled task principal (run with highest privileges)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the scheduled task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Automated daily backup of CRM PostgreSQL database"
    
    Write-Log "✅ Scheduled task created successfully"
} catch {
    Write-Log "❌ ERROR: Failed to create scheduled task - $($_.Exception.Message)"
    exit 1
}

# Verify task creation
$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Task) {
    Write-Log "Task Status: $($Task.State)"
    Write-Log "Next Run Time: $((Get-ScheduledTaskInfo -TaskName $TaskName).NextRunTime)"
} else {
    Write-Log "❌ ERROR: Task verification failed"
    exit 1
}

# Test backup script
Write-Host ""
$RunTest = Read-Host "Would you like to run a test backup now? (yes/no)"
if ($RunTest -eq "yes") {
    Write-Log "Running test backup..."
    & $BackupScript -BackupDir $BackupDir
    Write-Log "✅ Test backup completed"
}

Write-Log "=========================================="
Write-Log "Backup automation setup complete!"
Write-Log ""
Write-Log "Task Name: $TaskName"
Write-Log "Backup Schedule: Daily at $BackupTime"
Write-Log "Backup Location: $BackupDir"
Write-Log "Backup Script: $BackupScript"
Write-Log ""
Write-Log "To view task: Get-ScheduledTask -TaskName '$TaskName'"
Write-Log "To run manually: Start-ScheduledTask -TaskName '$TaskName'"
Write-Log "To disable: Disable-ScheduledTask -TaskName '$TaskName'"
Write-Log "To remove: Unregister-ScheduledTask -TaskName '$TaskName'"
Write-Log "=========================================="

exit 0
