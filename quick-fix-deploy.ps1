# QUICK FIX AND DEPLOY
Write-Output "Starting quick fix..."
git add vercel.json
git commit -m "Fix Vercel routing"
git push origin main
Write-Output "Pushed to GitHub"
Write-Output "Triggering Vercel..."
Start-Sleep -Seconds 3
Write-Output "DONE - Check Vercel dashboard"

