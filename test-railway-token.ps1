# 🔍 Test Railway Token Authentication
param(
    [string]$Token = "83d3cbb6-b8c7-45d4-987d-3e0bbd37cf5f"
)

Write-Host "🔍 Testing Railway Token Authentication" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

Write-Host "🔑 Token: $($Token.Substring(0,8))..." -ForegroundColor Cyan

# Test 1: Railway GraphQL API
Write-Host "📡 Testing Railway GraphQL API..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

$query = @{
    query = "query { me { id name email } }"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql" -Method POST -Headers $headers -Body $query
    Write-Host "✅ GraphQL API Success!" -ForegroundColor Green
    Write-Host "👤 User: $($response.data.me.name)" -ForegroundColor Cyan
    Write-Host "📧 Email: $($response.data.me.email)" -ForegroundColor Cyan
    Write-Host "🆔 ID: $($response.data.me.id)" -ForegroundColor Cyan
    
    # Test 2: List projects
    Write-Host ""
    Write-Host "📋 Testing project list..." -ForegroundColor Yellow
    
    $projectsQuery = @{
        query = "query { me { projects { id name } } }"
    } | ConvertTo-Json
    
    $projectsResponse = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql" -Method POST -Headers $headers -Body $projectsQuery
    Write-Host "✅ Projects API Success!" -ForegroundColor Green
    
    if ($projectsResponse.data.me.projects.Count -gt 0) {
        Write-Host "📁 Existing projects:" -ForegroundColor Cyan
        foreach ($project in $projectsResponse.data.me.projects) {
            Write-Host "  - $($project.name) ($($project.id))" -ForegroundColor White
        }
    } else {
        Write-Host "📁 No existing projects found" -ForegroundColor Yellow
    }
    
    # Now try to use Railway CLI with the token
    Write-Host ""
    Write-Host "🚀 Testing Railway CLI with token..." -ForegroundColor Yellow
    
    $env:RAILWAY_TOKEN = $Token
    $cliResult = railway whoami 2>&1
    
    if ($cliResult -match "Unauthorized") {
        Write-Host "❌ Railway CLI still not working with token" -ForegroundColor Red
        Write-Host "💡 Token works with API but not CLI" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Railway CLI working!" -ForegroundColor Green
        Write-Host "👤 CLI User: $cliResult" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "🔑 Token is invalid or expired" -ForegroundColor Red
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "🌐 API endpoint not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
