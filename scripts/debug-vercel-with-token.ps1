# Vercel Debug Script với API Token

param(
    [string]$VercelToken = "ZsbCzFTW3LXddEi5ckkRtYcx",
    [string]$VercelTeam = $null,
    [string]$VercelProject = "soulfriend"
)

$env:VERCEL_TOKEN = $VercelToken

Write-Host "🔍 Vercel Debug Script với API Token" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to make Vercel API request
function Invoke-VercelAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $VercelToken"
        "Content-Type" = "application/json"
    }
    
    try {
        $params = @{
            Uri = "https://api.vercel.com/$Endpoint"
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
Write-Host "Test 1: Verifying Vercel Token..." -ForegroundColor Yellow
try {
    $whoami = Invoke-VercelAPI -Endpoint "v2/user"
    if ($whoami.Success) {
        Write-Host "✅ Token valid!" -ForegroundColor Green
        Write-Host "   User: $($whoami.Data.user.username)" -ForegroundColor Gray
        Write-Host "   Email: $($whoami.Data.user.email)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Token invalid: $($whoami.Error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to verify token: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Projects
Write-Host "Test 2: Getting Vercel Projects..." -ForegroundColor Yellow
$projects = Invoke-VercelAPI -Endpoint "v9/projects"
if ($projects.Success) {
    Write-Host "✅ Found $($projects.Data.projects.Count) projects" -ForegroundColor Green
    
    $soulfriendProject = $projects.Data.projects | Where-Object { $_.name -eq $VercelProject }
    if ($soulfriendProject) {
        Write-Host "`n   ✅ Found project: $($soulfriendProject.name)" -ForegroundColor Green
        Write-Host "   ID: $($soulfriendProject.id)" -ForegroundColor Gray
        Write-Host "   Created: $($soulfriendProject.createdAt)" -ForegroundColor Gray
        Write-Host "   Updated: $($soulfriendProject.updatedAt)" -ForegroundColor Gray
        
        # Get environment variables
        Write-Host "`n   Environment Variables:" -ForegroundColor Cyan
        $envVars = Invoke-VercelAPI -Endpoint "v9/projects/$($soulfriendProject.id)/env"
        if ($envVars.Success) {
            $importantVars = @("REACT_APP_API_URL", "REACT_APP_BACKEND_URL")
            foreach ($var in $envVars.Data.envs) {
                if ($importantVars -contains $var.key) {
                    $value = $var.value
                    if ($var.value.Length -gt 50) {
                        $value = $var.value.Substring(0, 50) + "..."
                    }
                    Write-Host "     - $($var.key): $value" -ForegroundColor $(if ($var.value) { "Green" } else { "Red" })
                    Write-Host "       Environment: $($var.target -join ', ')" -ForegroundColor Gray
                }
            }
            
            # Check for missing vars
            $missingVars = @()
            if (-not ($envVars.Data.envs | Where-Object { $_.key -eq "REACT_APP_API_URL" })) {
                $missingVars += "REACT_APP_API_URL"
            }
            if (-not ($envVars.Data.envs | Where-Object { $_.key -eq "REACT_APP_BACKEND_URL" })) {
                $missingVars += "REACT_APP_BACKEND_URL"
            }
            if ($missingVars.Count -gt 0) {
                Write-Host "`n     ⚠️  Missing critical variables: $($missingVars -join ', ')" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ⚠️  Project '$VercelProject' not found" -ForegroundColor Yellow
        Write-Host "   Available projects:" -ForegroundColor Gray
        foreach ($proj in $projects.Data.projects) {
            Write-Host "     - $($proj.name)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ Failed to get projects: $($projects.Error)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Get Deployments
if ($soulfriendProject) {
    Write-Host "Test 3: Getting Recent Deployments..." -ForegroundColor Yellow
    $deployments = Invoke-VercelAPI -Endpoint "v6/deployments?projectId=$($soulfriendProject.id)&limit=5"
    if ($deployments.Success) {
        Write-Host "✅ Found $($deployments.Data.deployments.Count) recent deployments" -ForegroundColor Green
        
        $latestDeployment = $deployments.Data.deployments[0]
        Write-Host "`n   Latest Deployment:" -ForegroundColor Cyan
        Write-Host "   - ID: $($latestDeployment.uid)" -ForegroundColor Gray
        Write-Host "   - URL: $($latestDeployment.url)" -ForegroundColor Gray
        Write-Host "   - State: $($latestDeployment.state)" -ForegroundColor $(if ($latestDeployment.state -eq "READY") { "Green" } else { "Yellow" })
        Write-Host "   - Created: $($latestDeployment.createdAt)" -ForegroundColor Gray
        
        if ($latestDeployment.state -ne "READY") {
            Write-Host "   ⚠️  Latest deployment is not READY!" -ForegroundColor Yellow
        }
        
        # Get build logs
        Write-Host "`n   Getting Build Logs..." -ForegroundColor Cyan
        $logs = Invoke-VercelAPI -Endpoint "v2/deployments/$($latestDeployment.uid)/events?limit=100"
        if ($logs.Success) {
            Write-Host "   Recent Logs (last 20 lines):" -ForegroundColor Cyan
            Write-Host "   ----------------------------------------" -ForegroundColor Gray
            $logEvents = $logs.Data | Select-Object -Last 20
            foreach ($log in $logEvents) {
                $color = "Gray"
                if ($log.type -eq "error") {
                    $color = "Red"
                } elseif ($log.type -eq "build") {
                    $color = "Yellow"
                } elseif ($log.payload -match "success|Success|SUCCESS|✅") {
                    $color = "Green"
                }
                Write-Host "   [$($log.type)] $($log.payload)" -ForegroundColor $color
            }
        }
    } else {
        Write-Host "❌ Failed to get deployments: $($deployments.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Debug Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Token: Valid" -ForegroundColor Green
Write-Host "- Project: $(if ($soulfriendProject) { 'Found' } else { 'Not Found' })" -ForegroundColor $(if ($soulfriendProject) { "Green" } else { "Red" })
Write-Host "- Latest Deployment: $($latestDeployment.state)" -ForegroundColor $(if ($latestDeployment.state -eq "READY") { "Green" } else { "Yellow" })
