# 🚀 Deploy Backend to Railway
# This script helps deploy backend to Railway

Write-Host "🚀 Deploy Backend to Railway" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step-by-step guide:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Vào Railway Dashboard: https://railway.app" -ForegroundColor Cyan
Write-Host "2. Click 'New Project'" -ForegroundColor White
Write-Host "3. Select 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "4. Choose repository: soulfriend" -ForegroundColor White
Write-Host "5. Select 'backend' folder as root directory" -ForegroundColor White
Write-Host "6. Name it: soulfriend-backend" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Environment Variables cần thiết:" -ForegroundColor Magenta
Write-Host ""
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "PORT=5000" -ForegroundColor White
Write-Host "NODE_VERSION=20" -ForegroundColor White
Write-Host ""
Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend" -ForegroundColor Yellow
Write-Host "JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long" -ForegroundColor Yellow
Write-Host "ENCRYPTION_KEY=your-encryption-key-64-hex-characters" -ForegroundColor Yellow
Write-Host ""
Write-Host "DEFAULT_ADMIN_USERNAME=admin" -ForegroundColor White
Write-Host "DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn" -ForegroundColor White
Write-Host "DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM" -ForegroundColor White
Write-Host ""

Write-Host "⚠️ QUAN TRỌNG:" -ForegroundColor Red
Write-Host "- Thay đổi MONGODB_URI với MongoDB Atlas credentials của bạn" -ForegroundColor Yellow
Write-Host "- Tạo JWT_SECRET mới (random string ít nhất 32 ký tự)" -ForegroundColor Yellow
Write-Host "- Tạo ENCRYPTION_KEY mới (64 hex characters)" -ForegroundColor Yellow
Write-Host "- Đổi DEFAULT_ADMIN_PASSWORD thành password mạnh" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Sau khi deploy Backend thành công:" -ForegroundColor Cyan
Write-Host "1. Copy Backend URL từ Railway (vd: https://soulfriend-backend.railway.app)" -ForegroundColor White
Write-Host "2. Vào Vercel Dashboard" -ForegroundColor White
Write-Host "3. Add Environment Variable:" -ForegroundColor White
Write-Host "   REACT_APP_API_URL=<backend-url-from-railway>" -ForegroundColor Yellow
Write-Host "4. Redeploy Frontend trên Vercel" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Test Backend:" -ForegroundColor Green
Write-Host "Sau khi deploy, test bằng cách truy cập:" -ForegroundColor White
Write-Host "https://your-backend-url.railway.app/api/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Nếu thấy response JSON là backend đã hoạt động!" -ForegroundColor Green
Write-Host ""

# Check if git is up to date
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️ Có uncommitted changes. Commit trước khi deploy:" -ForegroundColor Yellow
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m 'chore: prepare for Railway backend deployment'" -ForegroundColor White
    Write-Host "git push origin main" -ForegroundColor White
} else {
    Write-Host "✅ Git is up to date, ready for Railway deployment" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
