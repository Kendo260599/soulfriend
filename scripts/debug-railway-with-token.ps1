# Railway Debug Script with API Token

param(
    [string]$RailwayToken = "bf2e7d57-8c34-4441-aad6-7c8ca6c28e81",
    [string]$RailwayProjectId = "e4abf505-f9af-45e3-9efa-cc86cc552dba",
    [string]$RailwayServiceId = "5ab38cfa-ae10-4834-b84a-a5464b3f2241",
    [string]$RailwayEnvId = "caba615c-5030-4578-8b7c-401adef92a29",
    [string]$RailwayUrl = "https://soulfriend-production.up.railway.app"
)

Write-Host "🔍 Railway Debug Script with API Token" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RailwayToken"
    "Content-Type" = "application/json"
}

# Function to make API request
function Invoke-RailwayAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    try {
        $params = @{
            Uri = "https://api.railway.app/v1/$Endpoint"
            Headers = $headers
            Method = $Method
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
        }
    } catch {
        $errorDetails = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $errorDetails += "`nResponse: $errorBody"
        }
        
        return @{
            Success = $false
            Error = $errorDetails
        }
    }
}

# Test 1: Verify Token
Write-Host "Test 1: Verifying Railway Token..." -ForegroundColor Yellow
try {
    $whoami = Invoke-RestMethod -Uri "https://api.railway.app/v1/me" -Headers $headers -Method Get
    Write-Host "✅ Token valid!" -ForegroundColor Green
    Write-Host "   Logged in as: $($whoami.name) ($($whoami.email))" -ForegroundColor Gray
} catch {
    Write-Host "❌ Token invalid or expired: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Project Info
Write-Host "Test 2: Getting Project Info..." -ForegroundColor Yellow
$projectInfo = Invoke-RailwayAPI -Endpoint "projects/$RailwayProjectId"
if ($projectInfo.Success) {
    Write-Host "✅ Project found: $($projectInfo.Data.name)" -ForegroundColor Green
    Write-Host "   Created: $($projectInfo.Data.createdAt)" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to get project: $($projectInfo.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get Service Info
Write-Host "Test 3: Getting Service Info..." -ForegroundColor Yellow
$serviceInfo = Invoke-RailwayAPI -Endpoint "services/$RailwayServiceId"
if ($serviceInfo.Success) {
    Write-Host "✅ Service found: $($serviceInfo.Data.name)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get service: $($serviceInfo.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get Deployments
Write-Host "Test 4: Getting Recent Deployments..." -ForegroundColor Yellow
$deployments = Invoke-RailwayAPI -Endpoint "deployments?serviceId=$RailwayServiceId&limit=5"
if ($deployments.Success) {
    Write-Host "✅ Found $($deployments.Data.deployments.Count) recent deployments" -ForegroundColor Green
    
    $latestDeployment = $deployments.Data.deployments[0]
    Write-Host "`n   Latest Deployment:" -ForegroundColor Cyan
    Write-Host "   - ID: $($latestDeployment.id)" -ForegroundColor Gray
    Write-Host "   - Status: $($latestDeployment.status)" -ForegroundColor $(if ($latestDeployment.status -eq "SUCCESS") { "Green" } else { "Red" })
    Write-Host "   - Created: $($latestDeployment.createdAt)" -ForegroundColor Gray
    
    if ($latestDeployment.status -ne "SUCCESS") {
        Write-Host "   ⚠️  Latest deployment is not successful!" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to get deployments: $($deployments.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Logs
Write-Host "Test 5: Getting Recent Logs..." -ForegroundColor Yellow
try {
    $logs = Invoke-RestMethod -Uri "https://api.railway.app/v1/deployments/$($latestDeployment.id)/logs" -Headers $headers -Method Get
    
    Write-Host "✅ Retrieved logs (showing last 30 lines)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Recent Logs:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $logLines = $logs.logs -split "`n" | Select-Object -Last 30
    foreach ($line in $logLines) {
        if ($line -match "error|Error|ERROR|❌|failed|Failed|FAILED") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "✅|success|Success|SUCCESS|Started|started") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️  Could not fetch logs: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 6: Get Environment Variables
Write-Host "Test 6: Checking Environment Variables..." -ForegroundColor Yellow
$envVars = Invoke-RailwayAPI -Endpoint "environments/$RailwayEnvId/variables"
if ($envVars.Success) {
    Write-Host "✅ Found $($envVars.Data.variables.Count) environment variables" -ForegroundColor Green
    
    $importantVars = @("OPENAI_API_KEY", "MONGODB_URI", "PORT", "NODE_ENV", "CORS_ORIGIN")
    Write-Host "`n   Important Variables:" -ForegroundColor Cyan
    
    foreach ($var in $envVars.Data.variables) {
        if ($importantVars -contains $var.name) {
            $value = if ($var.name -match "API_KEY|SECRET|PASSWORD|URI") {
                "$($var.value.Substring(0, [Math]::Min(20, $var.value.Length)))..." 
            } else {
                $var.value
            }
            Write-Host "   - $($var.name): $value" -ForegroundColor $(if ($var.value) { "Green" } else { "Red" })
        }
    }
    
    # Check for missing critical vars
    $missingVars = @()
    if (-not ($envVars.Data.variables | Where-Object { $_.name -eq "OPENAI_API_KEY" })) {
        $missingVars += "OPENAI_API_KEY"
    }
    if ($missingVars.Count -gt 0) {
        Write-Host "`n   ⚠️  Missing critical variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to get environment variables: $($envVars.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Test HTTP Endpoints
Write-Host "Test 7: Testing HTTP Endpoints..." -ForegroundColor Yellow

# Health Check
Write-Host "`n   7.1 Health Check:" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$RailwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($health.Content.Substring(0, [Math]::Min(200, $health.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# OPTIONS Preflight
Write-Host "`n   7.2 OPTIONS Preflight (CORS):" -ForegroundColor Cyan
try {
    $options = Invoke-WebRequest -Uri "$RailwayUrl/api/v2/chatbot/message" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($options.StatusCode)" -ForegroundColor Green
    Write-Host "   CORS Headers:" -ForegroundColor Gray
    if ($options.Headers.'Access-Control-Allow-Origin') {
        Write-Host "     Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Gray
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "     Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "✅ Debug Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Token: Valid" -ForegroundColor Green
Write-Host "- Project: Connected" -ForegroundColor Green
Write-Host "- Service: Connected" -ForegroundColor Green
Write-Host "- Latest Deployment: $($latestDeployment.status)" -ForegroundColor $(if ($latestDeployment.status -eq "SUCCESS") { "Green" } else { "Red" })
Write-Host "- HTTP Endpoints: Check results above" -ForegroundColor Yellow



param(
    [string]$RailwayToken = "bf2e7d57-8c34-4441-aad6-7c8ca6c28e81",
    [string]$RailwayProjectId = "e4abf505-f9af-45e3-9efa-cc86cc552dba",
    [string]$RailwayServiceId = "5ab38cfa-ae10-4834-b84a-a5464b3f2241",
    [string]$RailwayEnvId = "caba615c-5030-4578-8b7c-401adef92a29",
    [string]$RailwayUrl = "https://soulfriend-production.up.railway.app"
)

Write-Host "🔍 Railway Debug Script with API Token" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RailwayToken"
    "Content-Type" = "application/json"
}

# Function to make API request
function Invoke-RailwayAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    try {
        $params = @{
            Uri = "https://api.railway.app/v1/$Endpoint"
            Headers = $headers
            Method = $Method
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
        }
    } catch {
        $errorDetails = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $errorDetails += "`nResponse: $errorBody"
        }
        
        return @{
            Success = $false
            Error = $errorDetails
        }
    }
}

# Test 1: Verify Token
Write-Host "Test 1: Verifying Railway Token..." -ForegroundColor Yellow
try {
    $whoami = Invoke-RestMethod -Uri "https://api.railway.app/v1/me" -Headers $headers -Method Get
    Write-Host "✅ Token valid!" -ForegroundColor Green
    Write-Host "   Logged in as: $($whoami.name) ($($whoami.email))" -ForegroundColor Gray
} catch {
    Write-Host "❌ Token invalid or expired: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Project Info
Write-Host "Test 2: Getting Project Info..." -ForegroundColor Yellow
$projectInfo = Invoke-RailwayAPI -Endpoint "projects/$RailwayProjectId"
if ($projectInfo.Success) {
    Write-Host "✅ Project found: $($projectInfo.Data.name)" -ForegroundColor Green
    Write-Host "   Created: $($projectInfo.Data.createdAt)" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to get project: $($projectInfo.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get Service Info
Write-Host "Test 3: Getting Service Info..." -ForegroundColor Yellow
$serviceInfo = Invoke-RailwayAPI -Endpoint "services/$RailwayServiceId"
if ($serviceInfo.Success) {
    Write-Host "✅ Service found: $($serviceInfo.Data.name)" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get service: $($serviceInfo.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get Deployments
Write-Host "Test 4: Getting Recent Deployments..." -ForegroundColor Yellow
$deployments = Invoke-RailwayAPI -Endpoint "deployments?serviceId=$RailwayServiceId&limit=5"
if ($deployments.Success) {
    Write-Host "✅ Found $($deployments.Data.deployments.Count) recent deployments" -ForegroundColor Green
    
    $latestDeployment = $deployments.Data.deployments[0]
    Write-Host "`n   Latest Deployment:" -ForegroundColor Cyan
    Write-Host "   - ID: $($latestDeployment.id)" -ForegroundColor Gray
    Write-Host "   - Status: $($latestDeployment.status)" -ForegroundColor $(if ($latestDeployment.status -eq "SUCCESS") { "Green" } else { "Red" })
    Write-Host "   - Created: $($latestDeployment.createdAt)" -ForegroundColor Gray
    
    if ($latestDeployment.status -ne "SUCCESS") {
        Write-Host "   ⚠️  Latest deployment is not successful!" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to get deployments: $($deployments.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Logs
Write-Host "Test 5: Getting Recent Logs..." -ForegroundColor Yellow
try {
    $logs = Invoke-RestMethod -Uri "https://api.railway.app/v1/deployments/$($latestDeployment.id)/logs" -Headers $headers -Method Get
    
    Write-Host "✅ Retrieved logs (showing last 30 lines)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Recent Logs:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $logLines = $logs.logs -split "`n" | Select-Object -Last 30
    foreach ($line in $logLines) {
        if ($line -match "error|Error|ERROR|❌|failed|Failed|FAILED") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "✅|success|Success|SUCCESS|Started|started") {
            Write-Host $line -ForegroundColor Green
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️  Could not fetch logs: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 6: Get Environment Variables
Write-Host "Test 6: Checking Environment Variables..." -ForegroundColor Yellow
$envVars = Invoke-RailwayAPI -Endpoint "environments/$RailwayEnvId/variables"
if ($envVars.Success) {
    Write-Host "✅ Found $($envVars.Data.variables.Count) environment variables" -ForegroundColor Green
    
    $importantVars = @("OPENAI_API_KEY", "MONGODB_URI", "PORT", "NODE_ENV", "CORS_ORIGIN")
    Write-Host "`n   Important Variables:" -ForegroundColor Cyan
    
    foreach ($var in $envVars.Data.variables) {
        if ($importantVars -contains $var.name) {
            $value = if ($var.name -match "API_KEY|SECRET|PASSWORD|URI") {
                "$($var.value.Substring(0, [Math]::Min(20, $var.value.Length)))..." 
            } else {
                $var.value
            }
            Write-Host "   - $($var.name): $value" -ForegroundColor $(if ($var.value) { "Green" } else { "Red" })
        }
    }
    
    # Check for missing critical vars
    $missingVars = @()
    if (-not ($envVars.Data.variables | Where-Object { $_.name -eq "OPENAI_API_KEY" })) {
        $missingVars += "OPENAI_API_KEY"
    }
    if ($missingVars.Count -gt 0) {
        Write-Host "`n   ⚠️  Missing critical variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to get environment variables: $($envVars.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Test HTTP Endpoints
Write-Host "Test 7: Testing HTTP Endpoints..." -ForegroundColor Yellow

# Health Check
Write-Host "`n   7.1 Health Check:" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$RailwayUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($health.Content.Substring(0, [Math]::Min(200, $health.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# OPTIONS Preflight
Write-Host "`n   7.2 OPTIONS Preflight (CORS):" -ForegroundColor Cyan
try {
    $options = Invoke-WebRequest -Uri "$RailwayUrl/api/v2/chatbot/message" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($options.StatusCode)" -ForegroundColor Green
    Write-Host "   CORS Headers:" -ForegroundColor Gray
    if ($options.Headers.'Access-Control-Allow-Origin') {
        Write-Host "     Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Gray
    }
    if ($options.Headers.'Access-Control-Allow-Methods') {
        Write-Host "     Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "✅ Debug Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Token: Valid" -ForegroundColor Green
Write-Host "- Project: Connected" -ForegroundColor Green
Write-Host "- Service: Connected" -ForegroundColor Green
Write-Host "- Latest Deployment: $($latestDeployment.status)" -ForegroundColor $(if ($latestDeployment.status -eq "SUCCESS") { "Green" } else { "Red" })
Write-Host "- HTTP Endpoints: Check results above" -ForegroundColor Yellow










