# ============================================
# COMPLETE CRM SYSTEM TEST SUITE
# Tests: Login, Companies, Contacts, Deals, Activities
# ============================================

$baseUrl = "http://localhost:3001/api"
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    $global:totalTests++
    Write-Host "`n[$global:totalTests] Testing: $Name" -ForegroundColor Cyan
    Write-Host "  Method: $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        
        if ($Method -eq "Get" -and $response) {
            Write-Host "  Status: SUCCESS (200)" -ForegroundColor Green
            if ($response.PSObject.Properties.Name -contains "id") {
                Write-Host "  Response: Single object (id: $($response.id))" -ForegroundColor Gray
            } elseif ($response -is [Array]) {
                Write-Host "  Response: Array with $($response.Count) items" -ForegroundColor Gray
            } else {
                Write-Host "  Response: Object" -ForegroundColor Gray
            }
        } else {
            Write-Host "  Status: SUCCESS (200)" -ForegroundColor Green
        }
        
        $global:passedTests++
        return $response
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status: FAILED ($status)" -ForegroundColor Red
        
        if ($status -eq 403) {
            Write-Host "  ERROR: 403 Forbidden - Permissions issue" -ForegroundColor Yellow
            Write-Host "  ACTION: Clear localStorage and login again!" -ForegroundColor Yellow
        } elseif ($status -eq 401) {
            Write-Host "  ERROR: 401 Unauthorized - Token invalid" -ForegroundColor Yellow
        } elseif ($status -eq 404) {
            Write-Host "  ERROR: 404 Not Found - Endpoint doesn't exist" -ForegroundColor Yellow
        } else {
            Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        $global:failedTests++
        return $null
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    COMPLETE CRM SYSTEM TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ============================================
# PHASE 1: AUTHENTICATION
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 1: AUTHENTICATION" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$loginBody = @{
    email = "admin@crm.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Test-Endpoint -Name "Login" -Method "Post" -Url "$baseUrl/auth/login" -Body $loginBody

if (-not $loginResponse) {
    Write-Host "`nFATAL: Login failed. Cannot continue tests." -ForegroundColor Red
    exit 1
}

$token = $loginResponse.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`nLogin Details:" -ForegroundColor Cyan
Write-Host "  User: $($loginResponse.user.email)" -ForegroundColor White
Write-Host "  Role: $($loginResponse.user.role)" -ForegroundColor White
Write-Host "  Company: $($loginResponse.user.company.name)" -ForegroundColor White

# Check JWT permissions
$jwtParts = $token.Split('.')
if ($jwtParts.Length -eq 3) {
    $payload = $jwtParts[1]
    while ($payload.Length % 4 -ne 0) { $payload += "=" }
    $decoded = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload))
    $jwt = $decoded | ConvertFrom-Json
    
    if ($jwt.permissions) {
        Write-Host "  Permissions: $($jwt.permissions -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "  Permissions: MISSING IN JWT!" -ForegroundColor Red
        Write-Host "  WARNING: Old token detected. Clear localStorage and login again!" -ForegroundColor Yellow
    }
}

# ============================================
# PHASE 2: USER PROFILE
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 2: USER PROFILE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Test-Endpoint -Name "Get Profile" -Method "Get" -Url "$baseUrl/users/profile" -Headers $headers
Test-Endpoint -Name "List Users" -Method "Get" -Url "$baseUrl/users" -Headers $headers

# ============================================
# PHASE 3: COMPANIES
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 3: COMPANIES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$companies = Test-Endpoint -Name "List Companies" -Method "Get" -Url "$baseUrl/companies" -Headers $headers

$newCompanyBody = @{
    name = "Test Company $(Get-Random)"
    industry = "Technology"
    website = "https://test.com"
} | ConvertTo-Json

$newCompany = Test-Endpoint -Name "Create Company" -Method "Post" -Url "$baseUrl/companies" -Headers $headers -Body $newCompanyBody

if ($newCompany) {
    $companyId = $newCompany.id
    Test-Endpoint -Name "Get Company by ID" -Method "Get" -Url "$baseUrl/companies/$companyId" -Headers $headers
    
    $updateCompanyBody = @{
        name = "Updated Test Company"
        industry = "Software"
    } | ConvertTo-Json
    
    Test-Endpoint -Name "Update Company" -Method "Patch" -Url "$baseUrl/companies/$companyId" -Headers $headers -Body $updateCompanyBody
}

# ============================================
# PHASE 4: CONTACTS
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 4: CONTACTS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$contacts = Test-Endpoint -Name "List Contacts" -Method "Get" -Url "$baseUrl/contacts" -Headers $headers

if ($companies -and $companies.Count -gt 0) {
    $newContactBody = @{
        name = "Test Contact $(Get-Random)"
        email = "test$(Get-Random)@example.com"
        phone = "+1234567890"
        companyId = $companies[0].id
    } | ConvertTo-Json
    
    $newContact = Test-Endpoint -Name "Create Contact" -Method "Post" -Url "$baseUrl/contacts" -Headers $headers -Body $newContactBody
    
    if ($newContact) {
        $contactId = $newContact.id
        Test-Endpoint -Name "Get Contact by ID" -Method "Get" -Url "$baseUrl/contacts/$contactId" -Headers $headers
        
        $updateContactBody = @{
            name = "Updated Test Contact"
            phone = "+9876543210"
        } | ConvertTo-Json
        
        Test-Endpoint -Name "Update Contact" -Method "Patch" -Url "$baseUrl/contacts/$contactId" -Headers $headers -Body $updateContactBody
    }
}

# ============================================
# PHASE 5: DEALS
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 5: DEALS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$deals = Test-Endpoint -Name "List Deals" -Method "Get" -Url "$baseUrl/deals" -Headers $headers
Test-Endpoint -Name "Deals Statistics" -Method "Get" -Url "$baseUrl/deals/statistics" -Headers $headers

if ($companies -and $companies.Count -gt 0) {
    $newDealBody = @{
        title = "Test Deal $(Get-Random)"
        value = 50000
        stage = "PROPOSAL"
        companyId = $companies[0].id
    } | ConvertTo-Json
    
    $newDeal = Test-Endpoint -Name "Create Deal" -Method "Post" -Url "$baseUrl/deals" -Headers $headers -Body $newDealBody
    
    if ($newDeal) {
        $dealId = $newDeal.id
        Test-Endpoint -Name "Get Deal by ID" -Method "Get" -Url "$baseUrl/deals/$dealId" -Headers $headers
        
        $updateDealBody = @{
            title = "Updated Test Deal"
            stage = "NEGOTIATION"
            value = 75000
        } | ConvertTo-Json
        
        Test-Endpoint -Name "Update Deal" -Method "Patch" -Url "$baseUrl/deals/$dealId" -Headers $headers -Body $updateDealBody
    }
}

# ============================================
# PHASE 6: ACTIVITIES
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 6: ACTIVITIES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$activities = Test-Endpoint -Name "List Activities" -Method "Get" -Url "$baseUrl/activities" -Headers $headers
Test-Endpoint -Name "Activities Statistics" -Method "Get" -Url "$baseUrl/activities/statistics" -Headers $headers

$newActivityBody = @{
    title = "Test Activity $(Get-Random)"
    type = "TASK"
    status = "SCHEDULED"
    scheduledDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$newActivity = Test-Endpoint -Name "Create Activity" -Method "Post" -Url "$baseUrl/activities" -Headers $headers -Body $newActivityBody

if ($newActivity) {
    $activityId = $newActivity.id
    Test-Endpoint -Name "Get Activity by ID" -Method "Get" -Url "$baseUrl/activities/$activityId" -Headers $headers
    
    $updateActivityBody = @{
        title = "Updated Test Activity"
        status = "COMPLETED"
    } | ConvertTo-Json
    
    Test-Endpoint -Name "Update Activity" -Method "Patch" -Url "$baseUrl/activities/$activityId" -Headers $headers -Body $updateActivityBody
}

# ============================================
# PHASE 7: ANALYTICS
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 7: ANALYTICS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Test-Endpoint -Name "Analytics Overview" -Method "Get" -Url "$baseUrl/analytics/overview" -Headers $headers
Test-Endpoint -Name "Analytics Pipeline" -Method "Get" -Url "$baseUrl/analytics/pipeline" -Headers $headers
Test-Endpoint -Name "Analytics Revenue" -Method "Get" -Url "$baseUrl/analytics/revenue" -Headers $headers
Test-Endpoint -Name "Analytics Activities" -Method "Get" -Url "$baseUrl/analytics/activities" -Headers $headers
Test-Endpoint -Name "Analytics Team" -Method "Get" -Url "$baseUrl/analytics/team" -Headers $headers

# ============================================
# PHASE 8: SEARCH & NOTIFICATIONS
# ============================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "PHASE 8: SEARCH & NOTIFICATIONS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Test-Endpoint -Name "Search (query=test)" -Method "Get" -Url "$baseUrl/search?query=test" -Headers $headers
Test-Endpoint -Name "List Notifications" -Method "Get" -Url "$baseUrl/notifications" -Headers $headers

# ============================================
# FINAL RESULTS
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       FINAL TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests:  $totalTests" -ForegroundColor White
Write-Host "  Passed:       $passedTests" -ForegroundColor Green
Write-Host "  Failed:       $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host ""

$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)
Write-Host "  Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

Write-Host ""
if ($failedTests -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  CRM System is fully functional!" -ForegroundColor Green
} else {
    Write-Host "  Some tests failed. Review errors above." -ForegroundColor Yellow
    
    if ($failedTests -gt 0) {
        Write-Host ""
        Write-Host "  Common Issues:" -ForegroundColor Yellow
        Write-Host "  1. Old JWT token (missing permissions)" -ForegroundColor White
        Write-Host "     Fix: Clear localStorage and login again" -ForegroundColor Gray
        Write-Host "  2. Backend server not running" -ForegroundColor White
        Write-Host "     Fix: Start backend with 'npm run start:dev'" -ForegroundColor Gray
        Write-Host "  3. Database not seeded" -ForegroundColor White
        Write-Host "     Fix: Run 'npm run seed' in backend folder" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
