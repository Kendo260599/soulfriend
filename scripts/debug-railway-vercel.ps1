# PowerShell script to debug Railway and Vercel deployments

param(
    [string]$RailwayToken = $env:RAILWAY_TOKEN,
    [string]$VercelToken = $env:VERCEL_TOKEN,
    [string]$RailwayProjectId = "e4abf505-f9af-45e3-9efa-cc86cc552dba",
    [string]$RailwayServiceId = "5ab38cfa-ae10-4834-b84a-a5464b3f2241",
    [string]$RailwayEnvId = "caba615c-5030-4578-8b7c-401adef92a29",
    [string]$RailwayUrl = "https://soulfriend-production.up.railway.app",
    [string]$VercelUrl = "https://soulfriend-git-main-kendo260599s-projects.vercel.app"
)

Write-Host "🔍 Railway & Vercel Debugging Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
            Headers = $response.Headers
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode.value__
            Error = $_.Exception.Message
        }
    }
}

# Function to check Railway via CLI
function Test-RailwayCLI {
    Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
    
    try {
        $railwayVersion = railway --version 2>&1
        if ($railwayVersion -match "railway") {
            Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
            
            # Check if logged in
            $whoami = railway whoami 2>&1
            if ($whoami -notmatch "Unauthorized" -and $whoami -notmatch "not logged") {
                Write-Host "✅ Railway CLI logged in" -ForegroundColor Green
                
                # Get status
                Write-Host "📊 Railway Status:" -ForegroundColor Cyan
                railway status 2>&1 | Out-Host
                
                # Get recent logs
                Write-Host "`n📝 Recent Railway Logs:" -ForegroundColor Cyan
                railway logs --tail 30 2>&1 | Out-Host
                
                return $true
            } else {
                Write-Host "❌ Railway CLI not logged in" -ForegroundColor Red
                Write-Host "   Run: railway login" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "❌ Railway CLI not found" -ForegroundColor Red
            Write-Host "   Install: npm install -g @railway/cli" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Railway CLI check failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check Railway via API
function Test-RailwayAPI {
    if (-not $RailwayToken) {
        Write-Host "⚠️  Railway Token not provided (set RAILWAY_TOKEN env var)" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "🔍 Checking Railway via API..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $RailwayToken"
        }
        
        # Get deployments
        $deploymentsUrl = "https://api.railway.app/v1/deployments?serviceId=$RailwayServiceId"
        $deployments = Invoke-RestMethod -Uri $deploymentsUrl -Headers $headers -Method Get
        
        Write-Host "✅ Railway API connected" -ForegroundColor Green
        Write-Host "📊 Latest Deployment:" -ForegroundColor Cyan
        Write-Host "   ID: $($deployments.deployments[0].id)" -ForegroundColor White
        Write-Host "   Status: $($deployments.deployments[0].status)" -ForegroundColor White
        Write-Host "   Created: $($deployments.deployments[0].createdAt)" -ForegroundColor White
        
        return $true
    } catch {
        Write-Host "❌ Railway API check failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check Vercel via CLI
function Test-VercelCLI {
    Write-Host "`n🔍 Checking Vercel CLI..." -ForegroundColor Yellow
    
    try {
        $vercelVersion = vercel --version 2>&1
        if ($vercelVersion) {
            Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
            
            # Check if logged in
            $whoami = vercel whoami 2>&1
            if ($whoami -notmatch "Error" -and $whoami -notmatch "not logged") {
                Write-Host "✅ Vercel CLI logged in: $whoami" -ForegroundColor Green
                
                # List deployments
                Write-Host "`n📊 Vercel Deployments:" -ForegroundColor Cyan
                vercel ls 2>&1 | Select-Object -First 10 | Out-Host
                
                return $true
            } else {
                Write-Host "❌ Vercel CLI not logged in" -ForegroundColor Red
                Write-Host "   Run: vercel login" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
            Write-Host "   Install: npm install -g vercel" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Vercel CLI check failed: $_" -ForegroundColor Red
        return $false
    }
}

# Function to test Railway endpoints
function Test-RailwayEndpoints {
    Write-Host "`n🧪 Testing Railway Endpoints..." -ForegroundColor Yellow
    
    # Test 1: Health Check
    Write-Host "`n1. Health Check:" -ForegroundColor Cyan
    $health = Test-Endpoint -Url "$RailwayUrl/api/health"
    if ($health.Success) {
        Write-Host "   ✅ Status: $($health.StatusCode)" -ForegroundColor Green
        Write-Host "   Response: $($health.Content.Substring(0, [Math]::Min(200, $health.Content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed: $($health.StatusCode) - $($health.Error)" -ForegroundColor Red
    }
    
    # Test 2: OPTIONS Preflight
    Write-Host "`n2. OPTIONS Preflight (CORS):" -ForegroundColor Cyan
    $options = Test-Endpoint -Url "$RailwayUrl/api/v2/chatbot/message" -Method "OPTIONS" -Headers @{
        "Origin" = $VercelUrl
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    if ($options.Success) {
        Write-Host "   ✅ Status: $($options.StatusCode)" -ForegroundColor Green
        Write-Host "   CORS Headers:" -ForegroundColor Gray
        if ($options.Headers.'Access-Control-Allow-Origin') {
            Write-Host "      Access-Control-Allow-Origin: $($options.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Gray
        }
        if ($options.Headers.'Access-Control-Allow-Methods') {
            Write-Host "      Access-Control-Allow-Methods: $($options.Headers.'Access-Control-Allow-Methods')" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Failed: $($options.StatusCode) - $($options.Error)" -ForegroundColor Red
    }
    
    # Test 3: POST Chatbot
    Write-Host "`n3. POST Chatbot:" -ForegroundColor Cyan
    $postBody = @{
        message = "test"
        userId = "debug-test"
        sessionId = "debug-session"
    } | ConvertTo-Json
    
    $post = Test-Endpoint -Url "$RailwayUrl/api/v2/chatbot/message" -Method "POST" -Headers @{
        "Origin" = $VercelUrl
        "Content-Type" = "application/json"
    } -Body $postBody
    
    if ($post.Success) {
        Write-Host "   ✅ Status: $($post.StatusCode)" -ForegroundColor Green
        Write-Host "   Response: $($post.Content.Substring(0, [Math]::Min(200, $post.Content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed: $($post.StatusCode) - $($post.Error)" -ForegroundColor Red
    }
}

# Function to generate report
function Generate-Report {
    Write-Host "`n📋 Debugging Report" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Railway URL: $RailwayUrl" -ForegroundColor White
    Write-Host "Vercel URL: $VercelUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Railway CLI: $(if (Test-RailwayCLI) { '✅' } else { '❌' })" -ForegroundColor $(if (Test-RailwayCLI) { 'Green' } else { 'Red' })
    Write-Host "Vercel CLI: $(if (Test-VercelCLI) { '✅' } else { '❌' })" -ForegroundColor $(if (Test-VercelCLI) { 'Green' } else { 'Red' })
    Write-Host ""
    
    Test-RailwayEndpoints
}

# Main execution
Write-Host "Starting debugging..." -ForegroundColor Green
Write-Host ""

# Try Railway CLI first
if (-not (Test-RailwayCLI)) {
    # Fallback to API if CLI not available
    Test-RailwayAPI | Out-Null
}

# Try Vercel CLI
Test-VercelCLI | Out-Null

# Test endpoints
Test-RailwayEndpoints

# Generate report
Write-Host "`n✅ Debugging complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway dashboard for service status" -ForegroundColor White
Write-Host "2. Check Vercel dashboard for deployment status" -ForegroundColor White
Write-Host "3. Review logs above for errors" -ForegroundColor White
Write-Host "4. Share output with assistant for analysis" -ForegroundColor White










