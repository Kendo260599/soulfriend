# 🚀 Migrate từ Railway sang Fly.io
# Script hỗ trợ setup Fly.io deployment

Write-Host "🚀 Railway → Fly.io Migration Helper" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

Write-Host "📋 Bước 1: Install Fly CLI" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Chạy lệnh sau trong PowerShell (Admin):" -ForegroundColor White
Write-Host "  iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Cyan
Write-Host "`nHoặc download từ: https://fly.io/docs/getting-started/installing-flyctl/`n" -ForegroundColor White

Write-Host "📋 Bước 2: Login Fly.io" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Chạy lệnh:" -ForegroundColor White
Write-Host "  fly auth login" -ForegroundColor Cyan
Write-Host "  (Sẽ mở browser để login)`n" -ForegroundColor White

Write-Host "📋 Bước 3: Tạo Fly App" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Chạy lệnh trong project directory:" -ForegroundColor White
Write-Host "  cd 'd:\ung dung\soulfriend'" -ForegroundColor Cyan
Write-Host "  fly launch --name soulfriend-backend" -ForegroundColor Cyan
Write-Host "`nFly sẽ:" -ForegroundColor White
Write-Host "  - Detect Dockerfile" -ForegroundColor Cyan
Write-Host "  - Tạo fly.toml config file" -ForegroundColor Cyan
Write-Host "  - Ask về region (chọn gần nhất)" -ForegroundColor Cyan
Write-Host "  - Ask về scale (chọn shared-cpu-1x, 256MB RAM - FREE)`n" -ForegroundColor Cyan

Write-Host "📋 Bước 4: Set Environment Variables" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Chạy lệnh để set từng env variable:" -ForegroundColor White
Write-Host "  fly secrets set MONGODB_URI='your_mongodb_uri'" -ForegroundColor Cyan
Write-Host "  fly secrets set NODE_ENV='production'" -ForegroundColor Cyan
Write-Host "  fly secrets set CEREBRAS_API_KEY='your_key'" -ForegroundColor Cyan
Write-Host "  fly secrets set GEMINI_API_KEY='your_key'" -ForegroundColor Cyan
Write-Host "  fly secrets set JWT_SECRET='your_jwt_secret'" -ForegroundColor Cyan
Write-Host "  # ... (set tất cả env variables từ Railway)`n" -ForegroundColor Cyan

Write-Host "Hoặc set nhiều variables cùng lúc:" -ForegroundColor White
Write-Host "  fly secrets set MONGODB_URI='...' NODE_ENV='production' PORT='8080' ..." -ForegroundColor Cyan
Write-Host "`nLưu ý: Fly.io dùng 'secrets' thay vì 'env variables' (bảo mật hơn)`n" -ForegroundColor Yellow

Write-Host "📋 Bước 5: Update fly.toml (nếu cần)" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "File fly.toml sẽ được tạo tự động. Kiểm tra:" -ForegroundColor White
Write-Host "  - internal_port: 8080 (port trong container)" -ForegroundColor Cyan
Write-Host "  - processes: [app] (process name)" -ForegroundColor Cyan
Write-Host "  - [env]: PORT=8080 (env variable)`n" -ForegroundColor Cyan

Write-Host "📋 Bước 6: Deploy" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "Chạy lệnh:" -ForegroundColor White
Write-Host "  fly deploy" -ForegroundColor Cyan
Write-Host "`nFly sẽ:" -ForegroundColor White
Write-Host "  - Build Docker image" -ForegroundColor Cyan
Write-Host "  - Push to Fly registry" -ForegroundColor Cyan
Write-Host "  - Deploy to Fly platform" -ForegroundColor Cyan
Write-Host "  - Get URL: https://soulfriend-backend.fly.dev`n" -ForegroundColor Cyan

Write-Host "📋 Bước 7: Check Logs" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "  fly logs" -ForegroundColor Cyan
Write-Host "  fly status" -ForegroundColor Cyan
Write-Host "  fly info`n" -ForegroundColor Cyan

Write-Host "📋 Bước 8: Update Vercel Frontend" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Vào Vercel Dashboard → Project → Settings → Environment Variables" -ForegroundColor White
Write-Host "2. Update REACT_APP_API_URL:" -ForegroundColor White
Write-Host "   REACT_APP_API_URL=https://soulfriend-backend.fly.dev" -ForegroundColor Cyan
Write-Host "3. Redeploy frontend`n" -ForegroundColor White

Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "  - Fly.io Dashboard: https://fly.io/dashboard" -ForegroundColor White
Write-Host "  - Fly.io Docs: https://fly.io/docs" -ForegroundColor White
Write-Host "  - MongoDB Atlas: https://cloud.mongodb.com" -ForegroundColor White

Write-Host "`n📝 Note:" -ForegroundColor Yellow
Write-Host "  - Fly.io free tier: 3 shared-cpu VMs, 3GB storage" -ForegroundColor White
Write-Host "  - No cold start (always running)" -ForegroundColor White
Write-Host "  - Global edge network (fast worldwide)`n" -ForegroundColor White

Write-Host "💡 Pro Tips:" -ForegroundColor Yellow
Write-Host "  - Use 'fly scale count 1' để chỉ chạy 1 instance (free tier)" -ForegroundColor White
Write-Host "  - Use 'fly secrets list' để xem tất cả secrets" -ForegroundColor White
Write-Host "  - Use 'fly ssh console' để SSH vào container (debug)`n" -ForegroundColor White

