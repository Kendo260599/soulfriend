# Run local end-to-end workflow test for SoulFriend backend
# Usage: Open PowerShell in d:\ung dung\soulfriend\backend and run:
#   .\scripts\run_local_workflow_test.ps1

param(
    [int]$Port = 5000,
    [int]$StartupWaitSeconds = 6
)

Write-Host "[E2E] Building project..."
npm run build

# Start the compiled server (dist/index.js) as a background process
Write-Host "[E2E] Starting server (node dist/index.js)..."
$proc = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -PassThru
Write-Host "[E2E] Server started with PID $($proc.Id). Waiting $StartupWaitSeconds seconds for warmup..."
Start-Sleep -Seconds $StartupWaitSeconds

$base = "http://localhost:$Port"
$endpoints = @(
    "$base/api/health",
    "$base/api/test",
    "$base/api/test/sentry/error",
    "$base/api/test/sentry/capture",
    "$base/api/test/sentry/performance",
    "$base/api/test/sentry/db-error"
)

function Invoke-Check($url) {
    Write-Host "\n==== $url ===="
    try {
        $r = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 30
        $json = $r | ConvertTo-Json -Depth 6
        Write-Host $json
    } catch {
        Write-Host "ERROR calling $url : $_"
    }
}

# Run checks
foreach ($u in $endpoints) {
    Invoke-Check $u
}

Write-Host "\n[E2E] Tests complete. Stopping server (PID $($proc.Id))..."
try {
    Stop-Process -Id $proc.Id -Force -ErrorAction Stop
    Write-Host "[E2E] Server stopped"
} catch {
    Write-Host "[E2E] Failed to stop server process: $_"
}

Write-Host "[E2E] Done. Please check Sentry dashboard for captured events (if SENTRY_DSN is set)."