# FORCE REDEPLOY TO RENDER
# Trigger manual deployment

Write-Host "`n🚀 FORCING RENDER REDEPLOY`n" -ForegroundColor Green

# Option 1: Create empty commit to trigger deploy
Write-Host "📝 Creating trigger commit..." -ForegroundColor Cyan
git commit --allow-empty -m "🔄 Trigger Render redeploy - HITL & Conversation Learning"

Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✅ Redeploy triggered!" -ForegroundColor Green
Write-Host "⏰ Wait 3-5 minutes then check:" -ForegroundColor Yellow
Write-Host "   - https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   - Run: powershell -File verify-deployment.ps1" -ForegroundColor Gray
Write-Host ""

