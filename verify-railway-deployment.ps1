# Verify Node.js Version in Railway Deployment
Write-Host "🔍 Verifying Node.js version in Railway deployment..." -ForegroundColor Yellow

# Check if Railway CLI is available
try {
    railway --version
    Write-Host "✅ Railway CLI available" -ForegroundColor Green
    
    # Check current project
    railway status
    Write-Host ""
    
    # Show recent deployments
    Write-Host "📋 Recent deployments:" -ForegroundColor Cyan
    railway deployments --limit 5
    Write-Host ""
    
    # Show logs for latest deployment
    Write-Host "📝 Latest deployment logs:" -ForegroundColor Cyan
    railway logs --limit 50
    
} catch {
    Write-Host "❌ Railway CLI not available. Please install and login:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor White
    Write-Host "   railway login" -ForegroundColor White
}
