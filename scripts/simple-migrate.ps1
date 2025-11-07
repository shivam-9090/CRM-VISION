# Simple Migration Helper
# Usage: .\scripts\simple-migrate.ps1 [status|backup|deploy|verify]

param(
    [ValidateSet("status", "backup", "deploy", "verify")]
    [string]$Action = "status"
)

$Container = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null | Select-Object -First 1

function Show-Status {
    Write-Host "`nMigration Status:" -ForegroundColor Cyan
    Write-Host "================" -ForegroundColor Cyan
    
    Push-Location backend
    npx prisma migrate status
    Pop-Location
    
    if ($Container) {
        Write-Host "`nDatabase Info:" -ForegroundColor Cyan
        $Tables = docker exec $Container psql -U dev_user -d crm_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
        $Users = docker exec $Container psql -U dev_user -d crm_dev -t -c "SELECT COUNT(*) FROM users;" 2>$null
        
        Write-Host "Tables: $($Tables.Trim())" -ForegroundColor Gray
        if ($Users) {
            Write-Host "Users: $($Users.Trim())" -ForegroundColor Gray
        }
    }
}

function Do-Backup {
    Write-Host "Creating backup..." -ForegroundColor Cyan
    & ".\scripts\simple-backup.ps1"
}

function Do-Deploy {
    Write-Host "Deploying migrations..." -ForegroundColor Cyan
    
    # Backup first
    Write-Host "Step 1: Creating backup..." -ForegroundColor Yellow
    & ".\scripts\simple-backup.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Backup failed! Aborting." -ForegroundColor Red
        exit 1
    }
    
    # Confirm
    Write-Host "`nStep 2: Deploy migrations" -ForegroundColor Yellow
    $Confirm = Read-Host "Continue with migration? (yes/no)"
    
    if ($Confirm -ne "yes") {
        Write-Host "Migration cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    # Deploy
    Push-Location backend
    
    Write-Host "Deploying..." -ForegroundColor Cyan
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nRegenerating Prisma Client..." -ForegroundColor Cyan
        npx prisma generate
        Write-Host "SUCCESS: Migration complete!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Migration failed!" -ForegroundColor Red
        Write-Host "To rollback: .\scripts\simple-restore.ps1" -ForegroundColor Yellow
    }
    
    Pop-Location
}

function Do-Verify {
    Write-Host "Verifying database..." -ForegroundColor Cyan
    
    if (-not $Container) {
        Write-Host "ERROR: Container not found!" -ForegroundColor Red
        exit 1
    }
    
    # Check migrations
    Push-Location backend
    npx prisma migrate status
    Pop-Location
    
    # Check data
    Write-Host "`nData Integrity:" -ForegroundColor Cyan
    
    $Queries = @{
        "Users" = "SELECT COUNT(*) FROM users;"
        "Companies" = "SELECT COUNT(*) FROM companies;"
        "Deals" = "SELECT COUNT(*) FROM deals;"
        "Contacts" = "SELECT COUNT(*) FROM contacts;"
        "Activities" = "SELECT COUNT(*) FROM activities;"
    }
    
    foreach ($Table in $Queries.Keys) {
        $Query = $Queries[$Table]
        $Result = docker exec $Container psql -U dev_user -d crm_dev -t -c $Query 2>$null
        if ($Result) {
            Write-Host "$Table`: $($Result.Trim()) records" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nVerification complete!" -ForegroundColor Green
}

# Main
Write-Host "CRM Migration Helper" -ForegroundColor Cyan
Write-Host "Action: $Action`n" -ForegroundColor Gray

switch ($Action) {
    "status" { Show-Status }
    "backup" { Do-Backup }
    "deploy" { Do-Deploy }
    "verify" { Do-Verify }
}
