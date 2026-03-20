# Script để kiểm tra lỗi từ Sentry
# Yêu cầu: SENTRY_AUTH_TOKEN trong environment variables

param(
    [string]$SentryToken = $env:SENTRY_AUTH_TOKEN,
    [int]$Limit = 10,
    [string]$Query = "is:unresolved level:error"
)

if (-not $SentryToken) {
    Write-Host "❌ SENTRY_AUTH_TOKEN chưa được cấu hình!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cách sử dụng:" -ForegroundColor Yellow
    Write-Host "  1. Lấy token từ: https://sentry.io/settings/account/api/auth-tokens/" -ForegroundColor Cyan
    Write-Host "  2. Set environment variable:" -ForegroundColor Cyan
    Write-Host "     `$env:SENTRY_AUTH_TOKEN = 'your-token-here'" -ForegroundColor Cyan
    Write-Host "  3. Hoặc truyền token trực tiếp:" -ForegroundColor Cyan
    Write-Host "     .\check-sentry-errors.ps1 -SentryToken 'your-token-here'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Hoặc truy cập trực tiếp Sentry dashboard:" -ForegroundColor Yellow
    Write-Host "  https://sentry.io/organizations/[your-org]/issues/" -ForegroundColor Cyan
    exit 1
}

$SENTRY_API_BASE = "https://sentry.io/api/0"

Write-Host "🔍 Đang kết nối đến Sentry..." -ForegroundColor Yellow

try {
    # Lấy organization
    Write-Host "📊 Lấy danh sách organizations..." -ForegroundColor Cyan
    $orgResponse = Invoke-RestMethod -Uri "$SENTRY_API_BASE/organizations/" `
        -Headers @{ Authorization = "Bearer $SentryToken" } `
        -Method Get `
        -ErrorAction Stop

    if (-not $orgResponse -or $orgResponse.Count -eq 0) {
        Write-Host "❌ Không tìm thấy organization nào!" -ForegroundColor Red
        exit 1
    }

    $orgSlug = $orgResponse[0].slug
    Write-Host "✅ Organization: $orgSlug" -ForegroundColor Green

    # Lấy projects
    Write-Host "📊 Lấy danh sách projects..." -ForegroundColor Cyan
    $projectResponse = Invoke-RestMethod -Uri "$SENTRY_API_BASE/organizations/$orgSlug/projects/" `
        -Headers @{ Authorization = "Bearer $SentryToken" } `
        -Method Get `
        -ErrorAction Stop

    $projects = if ($projectResponse -is [array]) { $projectResponse } else { @($projectResponse) }
    $project = $projects | Where-Object { 
        $_.slug -like "*soulfriend*" -or $_.name -like "*soulfriend*" 
    } | Select-Object -First 1

    if (-not $project) {
        $project = $projects[0]
    }

    $projectSlug = $project.slug
    Write-Host "✅ Project: $projectSlug" -ForegroundColor Green
    Write-Host ""

    # Lấy issues
    Write-Host "🔍 Đang tìm lỗi gần đây (query: $Query)..." -ForegroundColor Cyan
    $issuesResponse = Invoke-RestMethod -Uri "$SENTRY_API_BASE/organizations/$orgSlug/issues/" `
        -Headers @{ Authorization = "Bearer $SentryToken" } `
        -Method Get `
        -Body @{
            project = $projectSlug
            query = $Query
            sort = "date"
            limit = $Limit
        } `
        -ErrorAction Stop

    $issues = if ($issuesResponse -is [array]) { $issuesResponse } else { @($issuesResponse) }

    if ($issues.Count -eq 0) {
        Write-Host "✅ Không có lỗi nào!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Xem tất cả issues tại:" -ForegroundColor Cyan
        Write-Host "   https://sentry.io/organizations/$orgSlug/issues/?project=$projectSlug" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Tìm thấy $($issues.Count) lỗi:" -ForegroundColor Red
        Write-Host ""

        foreach ($issue in $issues) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
            Write-Host "ID: $($issue.shortId)" -ForegroundColor White
            Write-Host "Title: $($issue.title)" -ForegroundColor Yellow
            Write-Host "Level: $($issue.level)" -ForegroundColor $(if ($issue.level -eq 'error') { 'Red' } else { 'Yellow' })
            Write-Host "Count: $($issue.count) lần" -ForegroundColor Cyan
            Write-Host "Status: $($issue.status)" -ForegroundColor $(if ($issue.status -eq 'unresolved') { 'Red' } else { 'Green' })
            Write-Host "First Seen: $($issue.firstSeen)" -ForegroundColor Gray
            Write-Host "Last Seen: $($issue.lastSeen)" -ForegroundColor Gray
            if ($issue.culprit) {
                Write-Host "Location: $($issue.culprit)" -ForegroundColor Gray
            }
            Write-Host "Link: $($issue.permalink)" -ForegroundColor Cyan
            Write-Host ""
        }

        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📊 Xem tất cả issues tại:" -ForegroundColor Cyan
        Write-Host "   https://sentry.io/organizations/$orgSlug/issues/?project=$projectSlug" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Lỗi khi truy vấn Sentry:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host ""
        Write-Host "⚠️  Token không hợp lệ hoặc đã hết hạn!" -ForegroundColor Yellow
        Write-Host "   Lấy token mới tại: https://sentry.io/settings/account/api/auth-tokens/" -ForegroundColor Cyan
    }
    
    exit 1
}
