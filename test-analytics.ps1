# Test all analytics endpoints with permissions
$baseUrl = "http://localhost:3001/api"

Write-Host ""
Write-Host "=== Testing All Analytics Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Login first
Write-Host "Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@crm.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "Logged in as: $($response.user.email) ($($response.user.role))" -ForegroundColor Green
Write-Host ""

# Test each analytics endpoint
$endpoints = @(
    "overview",
    "pipeline",
    "revenue",
    "activities",
    "team"
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing /analytics/$endpoint ..." -ForegroundColor Yellow -NoNewline
    
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/analytics/$endpoint" -Method Get -Headers $headers
        Write-Host " SUCCESS" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Host " FORBIDDEN (403)" -ForegroundColor Red
            Write-Host "  -> Permissions issue detected!" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host " NOT FOUND (404)" -ForegroundColor Yellow
        } else {
            Write-Host " ERROR ($statusCode)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
