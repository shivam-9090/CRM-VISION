# Railway Deployment Scripts

Write-Host "🚂 Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

function Show-Menu {
    Write-Host "Choose an action:" -ForegroundColor Yellow
    Write-Host "1. Generate JWT Secret" -ForegroundColor White
    Write-Host "2. Test Database Connection" -ForegroundColor White
    Write-Host "3. View Required Environment Variables" -ForegroundColor White
    Write-Host "4. Generate Railway Variable Commands" -ForegroundColor White
    Write-Host "5. Open Railway Dashboard" -ForegroundColor White
    Write-Host "6. Exit" -ForegroundColor White
    Write-Host ""
}

function Generate-JWTSecret {
    Write-Host "`n🔑 Generating JWT Secret..." -ForegroundColor Cyan
    
    $bytes = New-Object byte[] 32
    $rng = New-Object Security.Cryptography.RNGCryptoServiceProvider
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    Write-Host "`n✅ JWT Secret Generated:" -ForegroundColor Green
    Write-Host $secret -ForegroundColor Yellow
    Write-Host "`n📋 Copy this and add to Railway Variables as JWT_SECRET" -ForegroundColor White
    Set-Clipboard -Value $secret
    Write-Host "✅ Copied to clipboard!" -ForegroundColor Green
}

function Test-DatabaseConnection {
    Write-Host "`n🔍 Testing Database Connection..." -ForegroundColor Cyan
    
    # Check if .env exists
    $envPath = Join-Path $PSScriptRoot "backend\.env"
    if (Test-Path $envPath) {
        Write-Host "✅ Found .env file at: $envPath" -ForegroundColor Green
        
        # Try to connect using Prisma
        Push-Location backend
        Write-Host "`nRunning: npx prisma db push --preview-feature" -ForegroundColor Gray
        npx prisma db push --skip-generate
        Pop-Location
    } else {
        Write-Host "❌ .env file not found. Create it from .env.example" -ForegroundColor Red
    }
}

function Show-RequiredVariables {
    Write-Host "`n📋 Required Environment Variables for Railway:" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    
    $variables = @(
        @{Name="NODE_ENV"; Value="production"; Description="Environment mode"},
        @{Name="PORT"; Value="3001"; Description="Server port (Railway auto-assigns)"},
        @{Name="DATABASE_URL"; Value='${{Postgres.DATABASE_URL}}'; Description="PostgreSQL connection (auto)"},
        @{Name="FRONTEND_URL"; Value="https://your-frontend.com"; Description="Your frontend domain"},
        @{Name="JWT_SECRET"; Value="<generate-using-option-1>"; Description="JWT signing key"},
        @{Name="JWT_EXPIRATION"; Value="7d"; Description="Token expiry time"},
        @{Name="SMTP_HOST"; Value="smtp.gmail.com"; Description="Email server"},
        @{Name="SMTP_PORT"; Value="587"; Description="SMTP port"},
        @{Name="SMTP_USER"; Value="your-email@gmail.com"; Description="Your email"},
        @{Name="SMTP_PASS"; Value="<gmail-app-password>"; Description="Gmail app password"}
    )
    
    foreach ($var in $variables) {
        Write-Host "`n$($var.Name)" -ForegroundColor Yellow -NoNewline
        Write-Host " = " -ForegroundColor White -NoNewline
        Write-Host "$($var.Value)" -ForegroundColor Green
        Write-Host "  → $($var.Description)" -ForegroundColor Gray
    }
    
    Write-Host "`n💡 Tip: Set these in Railway Dashboard → Service → Variables" -ForegroundColor Cyan
}

function Generate-RailwayCommands {
    Write-Host "`n📝 Generating Railway CLI Commands..." -ForegroundColor Cyan
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    Write-Host "# Install Railway CLI (if not installed)" -ForegroundColor Gray
    Write-Host "npm install -g @railway/cli`n" -ForegroundColor White
    
    Write-Host "# Login to Railway" -ForegroundColor Gray
    Write-Host "railway login`n" -ForegroundColor White
    
    Write-Host "# Link to your project" -ForegroundColor Gray
    Write-Host "railway link`n" -ForegroundColor White
    
    Write-Host "# Set environment variables" -ForegroundColor Gray
    Write-Host "railway variables set NODE_ENV=production" -ForegroundColor White
    Write-Host "railway variables set PORT=3001" -ForegroundColor White
    Write-Host "railway variables set FRONTEND_URL=https://your-frontend.com" -ForegroundColor White
    Write-Host "railway variables set JWT_EXPIRATION=7d" -ForegroundColor White
    Write-Host "railway variables set SMTP_HOST=smtp.gmail.com" -ForegroundColor White
    Write-Host "railway variables set SMTP_PORT=587`n" -ForegroundColor White
    
    Write-Host "# View current variables" -ForegroundColor Gray
    Write-Host "railway variables`n" -ForegroundColor White
    
    Write-Host "# Deploy" -ForegroundColor Gray
    Write-Host "railway up`n" -ForegroundColor White
    
    Write-Host "# View logs" -ForegroundColor Gray
    Write-Host "railway logs`n" -ForegroundColor White
    
    Write-Host "💡 Copy these commands and run them in your terminal" -ForegroundColor Cyan
}

function Open-RailwayDashboard {
    Write-Host "`n🌐 Opening Railway Dashboard..." -ForegroundColor Cyan
    Start-Process "https://railway.app/dashboard"
}

# Main Loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-6)"
    
    switch ($choice) {
        "1" { Generate-JWTSecret }
        "2" { Test-DatabaseConnection }
        "3" { Show-RequiredVariables }
        "4" { Generate-RailwayCommands }
        "5" { Open-RailwayDashboard }
        "6" { 
            Write-Host "`n👋 Goodbye! Happy deploying! 🚀" -ForegroundColor Green
            break
        }
        default { 
            Write-Host "`n❌ Invalid choice. Please enter 1-6." -ForegroundColor Red
        }
    }
    
    if ($choice -ne "6") {
        Write-Host "`nPress any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Clear-Host
    }
    
} while ($choice -ne "6")
