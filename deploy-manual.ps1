# 🚀 SoulFriend Manual Deploy Script
Write-Host "🚀 SoulFriend Manual Deploy Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Write-Host ""
Write-Host "🔐 STEP 1: Login to Railway" -ForegroundColor Cyan
Write-Host "Run this command in terminal:" -ForegroundColor Yellow
Write-Host "railway login" -ForegroundColor White
Write-Host "Then paste this token: ef97cad8-db03-404b-aa04-1f3338740bcb" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter after logging in"

Write-Host ""
Write-Host "🚀 STEP 2: Deploy Backend" -ForegroundColor Cyan
Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host "cd backend" -ForegroundColor White
Write-Host "railway init" -ForegroundColor White
Write-Host "railway up --detach" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter after backend is deployed"

Write-Host ""
Write-Host "🔧 STEP 3: Set Backend Environment Variables" -ForegroundColor Cyan
Write-Host "Run these commands in backend directory:" -ForegroundColor Yellow
Write-Host "railway variables --set `"NODE_ENV=production`"" -ForegroundColor White
Write-Host "railway variables --set `"PORT=5000`"" -ForegroundColor White
Write-Host "railway variables --set `"MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend`"" -ForegroundColor White
Write-Host "railway variables --set `"JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production`"" -ForegroundColor White
Write-Host "railway variables --set `"ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production`"" -ForegroundColor White
Write-Host "railway variables --set `"DEFAULT_ADMIN_USERNAME=admin`"" -ForegroundColor White
Write-Host "railway variables --set `"DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn`"" -ForegroundColor White
Write-Host "railway variables --set `"DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!`"" -ForegroundColor White
Write-Host "railway variables --set `"GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM`"" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter after setting backend variables"

Write-Host ""
Write-Host "🌐 STEP 4: Deploy Frontend" -ForegroundColor Cyan
Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host "cd ../frontend" -ForegroundColor White
Write-Host "railway init" -ForegroundColor White
Write-Host "railway up --detach" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter after frontend is deployed"

Write-Host ""
Write-Host "🔧 STEP 5: Set Frontend Environment Variables" -ForegroundColor Cyan
Write-Host "First, get your backend URL:" -ForegroundColor Yellow
Write-Host "railway status" -ForegroundColor White
Write-Host "Then run:" -ForegroundColor Yellow
Write-Host "railway variables --set `"REACT_APP_API_URL=https://your-backend-url.railway.app`"" -ForegroundColor White
Write-Host "railway variables --set `"REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM`"" -ForegroundColor White
Write-Host ""

Write-Host "🎉 DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Check your Railway dashboard for URLs" -ForegroundColor Cyan
Write-Host "Test your application!" -ForegroundColor Cyan
Write-Host ""
Write-Host "💰 Cost: ~$3-5/month (within free tier!)" -ForegroundColor Green
Write-Host "🚀 Happy coding!" -ForegroundColor Green
