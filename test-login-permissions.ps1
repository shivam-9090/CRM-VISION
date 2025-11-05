# Test script to verify JWT permissions after login
Write-Host "" -ForegroundColor Cyan
Write-Host "=== Testing Login with Permissions ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api"

# Test login
Write-Host "" -ForegroundColor Yellow
Write-Host "1. Testing Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{
        email = "admin@crm.com"
        password = "password123"
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "User ID: $($loginResponse.user.id)" -ForegroundColor White
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "Permissions: $($loginResponse.user.permissions -join ', ')" -ForegroundColor White
    
    $token = $loginResponse.token
    
    # Decode JWT to see payload (base64 decode the middle part)
    $jwtParts = $token.Split('.')
    if ($jwtParts.Length -eq 3) {
        # Add padding if needed
        $payload = $jwtParts[1]
        while ($payload.Length % 4 -ne 0) {
            $payload += "="
        }
        $decodedBytes = [Convert]::FromBase64String($payload)
        $decodedPayload = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
        $payloadObj = $decodedPayload | ConvertFrom-Json
        
        Write-Host "" -ForegroundColor Cyan
        Write-Host "JWT Payload:" -ForegroundColor Cyan
        Write-Host "  ID: $($payloadObj.id)" -ForegroundColor White
        Write-Host "  Role: $($payloadObj.role)" -ForegroundColor White
        Write-Host "  Permissions: $($payloadObj.permissions -join ', ')" -ForegroundColor White
        
        if ($null -eq $payloadObj.permissions) {
            Write-Host "" -ForegroundColor Red
            Write-Host "ERROR: JWT payload missing 'permissions' field!" -ForegroundColor Red
            Write-Host "Backend needs restart to apply permissions fix!" -ForegroundColor Yellow
        } else {
            Write-Host "" -ForegroundColor Green
            Write-Host "JWT payload includes permissions!" -ForegroundColor Green
        }
    }
    
    # Test analytics endpoint (requires permissions)
    Write-Host "" -ForegroundColor Yellow
    Write-Host "2. Testing Analytics Dashboard (requires analytics:read)..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $analyticsResponse = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" -Method Get -Headers $headers
        Write-Host "✓ Analytics dashboard accessible!" -ForegroundColor Green
        Write-Host "Response keys: $($analyticsResponse.PSObject.Properties.Name -join ', ')" -ForegroundColor White
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Host "❌ 403 Forbidden - Backend still using old code without permissions in JWT" -ForegroundColor Red
            Write-Host "SOLUTION: Restart backend server to load new code!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Error: $_" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
}

Write-Host "" -ForegroundColor Cyan
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
