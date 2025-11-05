# Comprehensive API Test - All Endpoints
$baseUrl = "http://localhost:3001/api"
$passed = 0
$failed = 0

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   COMPREHENSIVE API ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "[1/12] Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = "admin@crm.com"; password = "password123" } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $headers = @{ "Authorization" = "Bearer $($auth.token)" }
    Write-Host "  LOGIN: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  LOGIN: FAILED" -ForegroundColor Red
    $failed++
    exit
}

# Health Check
Write-Host "[2/12] Health Check..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | Out-Null
    Write-Host "  HEALTH: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  HEALTH: FAILED" -ForegroundColor Red
    $failed++
}

# User Profile
Write-Host "[3/12] User Profile..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method Get -Headers $headers | Out-Null
    Write-Host "  PROFILE: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  PROFILE: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Companies
Write-Host "[4/12] Companies..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/companies" -Method Get -Headers $headers | Out-Null
    Write-Host "  COMPANIES: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  COMPANIES: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Contacts
Write-Host "[5/12] Contacts..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/contacts" -Method Get -Headers $headers | Out-Null
    Write-Host "  CONTACTS: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  CONTACTS: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Deals
Write-Host "[6/12] Deals..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/deals" -Method Get -Headers $headers | Out-Null
    Write-Host "  DEALS: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  DEALS: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Activities
Write-Host "[7/12] Activities..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/activities" -Method Get -Headers $headers | Out-Null
    Write-Host "  ACTIVITIES: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ACTIVITIES: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Analytics - Overview
Write-Host "[8/12] Analytics (Overview)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/analytics/overview" -Method Get -Headers $headers | Out-Null
    Write-Host "  ANALYTICS/OVERVIEW: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ANALYTICS/OVERVIEW: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Analytics - Pipeline
Write-Host "[9/12] Analytics (Pipeline)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/analytics/pipeline" -Method Get -Headers $headers | Out-Null
    Write-Host "  ANALYTICS/PIPELINE: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ANALYTICS/PIPELINE: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Search
Write-Host "[10/12] Search..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/search?query=test" -Method Get -Headers $headers | Out-Null
    Write-Host "  SEARCH: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  SEARCH: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Notifications
Write-Host "[11/12] Notifications..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headers | Out-Null
    Write-Host "  NOTIFICATIONS: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  NOTIFICATIONS: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Users List
Write-Host "[12/12] Users List..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers | Out-Null
    Write-Host "  USERS: SUCCESS" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  USERS: FAILED ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "             RESULTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  PASSED: $passed" -ForegroundColor Green
Write-Host "  FAILED: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "======================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "ALL TESTS PASSED! No API errors!" -ForegroundColor Green
    Write-Host "JWT permissions fix successful!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some tests failed. Check errors above." -ForegroundColor Yellow
}
