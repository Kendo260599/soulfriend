# Check Vercel deployment and save to file
$outputFile = "deployment-check-result.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Load environment variables
if (Test-Path ".env.vercel") {
    Get-Content ".env.vercel" | ForEach-Object {
        if ($_ -match '^VERCEL_TOKEN=(.+)$') { $env:VERCEL_TOKEN = $matches[1] }
        if ($_ -match '^VERCEL_PROJECT_ID=(.+)$') { $env:VERCEL_PROJECT_ID = $matches[1] }
    }
}

$output = @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🔍 VERCEL DEPLOYMENT CHECK 🔍                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

⏰ Check Time: $timestamp

"@

try {
    $headers = @{
        "Authorization" = "Bearer $env:VERCEL_TOKEN"
        "Accept" = "application/json"
    }
    
    $url = "https://api.vercel.com/v6/deployments?projectId=$env:VERCEL_PROJECT_ID&limit=1"
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
    
    if ($response.deployments -and $response.deployments.Count -gt 0) {
        $latest = $response.deployments[0]
        $createdTime = [datetime]$latest.createdAt
        $elapsed = (Get-Date) - $createdTime
        $ageMinutes = [math]::Round($elapsed.TotalMinutes, 1)
        
        $output += @"
✅ DEPLOYMENT FOUND!

🌐 URL:
   https://$($latest.url)

📊 STATUS:
   State: $($latest.state)
   Ready State: $($latest.readyState)
   Created: $ageMinutes minutes ago

"@
        
        if ($latest.state -eq "READY" -and $latest.readyState -eq "READY") {
            $output += @"
✅ DEPLOYMENT IS LIVE AND READY!

🧪 NEXT STEPS:
   1. Open: https://$($latest.url)
   2. Press F12 for DevTools
   3. Check Console tab - Should have fewer errors!
   4. Test chatbot AI
   5. Check manifest.json loads (no 404!)

🎯 EXPECTED IMPROVEMENTS:
   ✅ manifest.json should load (was 404 before)
   ✅ Static files from correct path
   ✅ Console cleaner
   ✅ Chatbot should work

"@
        } else {
            $output += @"
⏳ DEPLOYMENT STILL IN PROGRESS...
   State: $($latest.state)
   Please wait a few more minutes and check again.

"@
        }
        
        # Also check backend
        try {
            $backendResponse = Invoke-RestMethod -Uri "https://soulfriend-api.onrender.com/api/health" -Method GET -TimeoutSec 10
            $output += @"
🖥️ BACKEND STATUS:
   ✅ Backend: ONLINE
   Status: $($backendResponse.status)
   Chatbot: $($backendResponse.chatbot)
   AI: $($backendResponse.gemini)

"@
        } catch {
            $output += @"
🖥️ BACKEND STATUS:
   ⚠️ Backend: Error checking
   (This is normal if backend is sleeping)

"@
        }
        
    } else {
        $output += "❌ No deployments found!`n"
    }
    
} catch {
    $output += @"
❌ ERROR CHECKING DEPLOYMENT:
   $($_.Exception.Message)

"@
}

$output += @"
═══════════════════════════════════════════════════════════

📋 TO RUN MANUAL CHECK:
   1. Open PowerShell
   2. Run: .\check-deployment-to-file.ps1
   3. Read: deployment-check-result.txt

🌸 Check complete!
"@

# Save to file
$output | Out-File -FilePath $outputFile -Encoding UTF8

# Try to display (might not work but worth trying)
Write-Output $output


