# 🚀 Migrate từ Railway sang Render.com
# Script hỗ trợ export environment variables và hướng dẫn migrate

Write-Host "🚀 Railway → Render.com Migration Helper" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

Write-Host "📋 Bước 1: Export Environment Variables từ Railway" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Vào Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. Chọn project → Settings → Variables" -ForegroundColor White
Write-Host "3. Copy tất cả environment variables vào file: render-env-vars.txt`n" -ForegroundColor White

Write-Host "📋 Bước 2: Tạo Render Account" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Truy cập: https://render.com" -ForegroundColor White
Write-Host "2. Sign up với GitHub account" -ForegroundColor White
Write-Host "3. Verify email`n" -ForegroundColor White

Write-Host "📋 Bước 3: Tạo Web Service trên Render" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "2. Connect GitHub repo: Kendo260599/soulfriend" -ForegroundColor White
Write-Host "3. Config:" -ForegroundColor White
Write-Host "   - Name: soulfriend-backend" -ForegroundColor Cyan
Write-Host "   - Environment: Node" -ForegroundColor Cyan
Write-Host "   - Build Command: cd backend && npm install && npm run build" -ForegroundColor Cyan
Write-Host "   - Start Command: cd backend && node dist/index.js" -ForegroundColor Cyan
Write-Host "   - Root Directory: (để trống)`n" -ForegroundColor Cyan

Write-Host "📋 Bước 4: Set Environment Variables trên Render" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Vào Web Service → Environment" -ForegroundColor White
Write-Host "2. Add từng environment variable từ Railway`n" -ForegroundColor White

Write-Host "📋 Bước 5: MongoDB Setup" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Option A: Dùng MongoDB Atlas (FREE - Recommended)" -ForegroundColor White
Write-Host "  1. Truy cập: https://www.mongodb.com/cloud/atlas" -ForegroundColor Cyan
Write-Host "  2. Sign up (free tier: 512MB)" -ForegroundColor Cyan
Write-Host "  3. Create cluster → Get connection string" -ForegroundColor Cyan
Write-Host "  4. Update MONGODB_URI trong Render env variables`n" -ForegroundColor Cyan

Write-Host "Option B: Dùng Render MongoDB (90 ngày free)" -ForegroundColor White
Write-Host "  1. Render → New + → MongoDB" -ForegroundColor Cyan
Write-Host "  2. Chọn Free plan" -ForegroundColor Cyan
Write-Host "  3. Copy connection string" -ForegroundColor Cyan
Write-Host "  4. Update MONGODB_URI trong Web Service env variables`n" -ForegroundColor Cyan

Write-Host "📋 Bước 6: Deploy" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Render sẽ auto-deploy từ GitHub" -ForegroundColor White
Write-Host "2. Check logs: Logs tab" -ForegroundColor White
Write-Host "3. Get URL: https://soulfriend-backend.onrender.com`n" -ForegroundColor White

Write-Host "📋 Bước 7: Update Vercel Frontend" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Vào Vercel Dashboard → Project → Settings → Environment Variables" -ForegroundColor White
Write-Host "2. Update REACT_APP_API_URL:" -ForegroundColor White
Write-Host "   REACT_APP_API_URL=https://soulfriend-backend.onrender.com" -ForegroundColor Cyan
Write-Host "3. Redeploy frontend`n" -ForegroundColor White

Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "  - Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "  - MongoDB Atlas: https://cloud.mongodb.com" -ForegroundColor White
Write-Host "  - Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White

Write-Host "`n📝 Note:" -ForegroundColor Yellow
Write-Host "  - Render free tier có cold start (service sleep sau 15 phút không dùng)" -ForegroundColor White
Write-Host "  - First request có thể mất 30-60 giây để wake up" -ForegroundColor White
Write-Host "  - Nếu cần always-on, consider Fly.io hoặc self-host`n" -ForegroundColor White

# Tạo file template cho environment variables
$envTemplate = @"
# Render Environment Variables Template
# Copy từ Railway và paste vào đây

# Database
MONGODB_URI=your_mongodb_uri_here

# Server
NODE_ENV=production
PORT=10000

# API Keys
CEREBRAS_API_KEY=your_cerebras_api_key
GEMINI_API_KEY=your_gemini_api_key

# JWT
JWT_SECRET=your_jwt_secret

# Email (nếu dùng)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

# Add other environment variables từ Railway
"@

$envTemplate | Out-File -FilePath "render-env-vars-template.txt" -Encoding UTF8
Write-Host "✅ Đã tạo file: render-env-vars-template.txt" -ForegroundColor Green
Write-Host "   Hãy copy environment variables từ Railway vào file này`n" -ForegroundColor White

