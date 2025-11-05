# Test JWT permissions
$baseUrl = "http://localhost:3001/api"

Write-Host ""
Write-Host "=== Testing JWT Permissions ===" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "1. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@crm.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($response.user.email)" -ForegroundColor White
    Write-Host "Role: $($response.user.role)" -ForegroundColor White
    
    # Decode JWT
    $token = $response.token
    $parts = $token.Split('.')
    $payload = $parts[1]
    
    # Fix base64 padding
    while ($payload.Length % 4 -ne 0) {
        $payload += "="
    }
    
    $bytes = [Convert]::FromBase64String($payload)
    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)
    $jwt = $decoded | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "JWT Payload:" -ForegroundColor Cyan
    Write-Host "  ID: $($jwt.id)" -ForegroundColor White
    Write-Host "  Role: $($jwt.role)" -ForegroundColor White
    
    if ($jwt.permissions) {
        Write-Host "  Permissions: $($jwt.permissions -join ', ')" -ForegroundColor Green
        Write-Host ""
        Write-Host "JWT INCLUDES PERMISSIONS - Server restarted successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Permissions: MISSING" -ForegroundColor Red
        Write-Host ""
        Write-Host "JWT MISSING PERMISSIONS - Backend server NOT restarted!" -ForegroundColor Red
        Write-Host "ACTION REQUIRED: Restart backend server!" -ForegroundColor Yellow
    }
    
    # Test analytics
    Write-Host ""
    Write-Host "2. Testing Analytics Endpoint..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" -Method Get -Headers $headers
        Write-Host "Analytics endpoint accessible!" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            Write-Host "403 FORBIDDEN - Backend using old code!" -ForegroundColor Red
            Write-Host "RESTART BACKEND SERVER!" -ForegroundColor Yellow
        } else {
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
