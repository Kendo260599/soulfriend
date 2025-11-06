# 🔍 Railway Debug - Get Logs Manually

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚨 CRITICAL: Server returning 502" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Vấn đề: Tất cả requests đều trả về 502 Bad Gateway" -ForegroundColor Yellow
Write-Host "Điều này có nghĩa Railway không thể connect đến backend service." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 CÁCH LẤY LOGS ĐỂ DEBUG:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Railway Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "1. Vào Railway Dashboard: https://railway.app" -ForegroundColor White
Write-Host "2. Chọn project 'soulfriend'" -ForegroundColor White
Write-Host "3. Click vào service 'soulfriend'" -ForegroundColor White
Write-Host "4. Click tab 'Deploy Logs'" -ForegroundColor White
Write-Host "5. Scroll xuống và copy 50-100 dòng cuối cùng" -ForegroundColor White
Write-Host "6. Gửi cho tôi để phân tích" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Railway CLI" -ForegroundColor Yellow
Write-Host "1. Mở terminal/PowerShell" -ForegroundColor White
Write-Host "2. Chạy: npm install -g @railway/cli" -ForegroundColor White
Write-Host "3. Chạy: railway login" -ForegroundColor White
Write-Host "4. Chạy: cd backend" -ForegroundColor White
Write-Host "5. Chạy: railway link" -ForegroundColor White
Write-Host "6. Chạy: railway logs --tail 100" -ForegroundColor White
Write-Host "7. Copy output và gửi cho tôi" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Railway API (Advanced)" -ForegroundColor Yellow
Write-Host "Sử dụng token để get logs qua API" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 WHAT TO LOOK FOR IN LOGS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Good Signs:" -ForegroundColor Green
Write-Host "  - '🚀 SoulFriend V4.0 Server Started!'" -ForegroundColor Gray
Write-Host "  - 'Port: XXXX'" -ForegroundColor Gray
Write-Host "  - '✅ MongoDB connected successfully'" -ForegroundColor Gray
Write-Host ""

Write-Host "❌ Bad Signs:" -ForegroundColor Red
Write-Host "  - '❌ Failed to start server'" -ForegroundColor Gray
Write-Host "  - 'Port XXXX is already in use'" -ForegroundColor Gray
Write-Host "  - '❌ Database connection failed'" -ForegroundColor Gray
Write-Host "  - 'Error: Cannot find module'" -ForegroundColor Gray
Write-Host "  - 'TypeError:' hoặc 'SyntaxError:'" -ForegroundColor Gray
Write-Host "  - 'EADDRINUSE'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 FIXES ĐÃ APPLY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ Server start BEFORE database connection" -ForegroundColor Green
Write-Host "2. ✅ Health check endpoint simplified" -ForegroundColor Green
Write-Host "3. ✅ Railway health check timeout increased to 300s" -ForegroundColor Green
Write-Host "4. ✅ CORS middleware set up correctly" -ForegroundColor Green
Write-Host ""

Write-Host "Nếu vẫn 502 sau khi deploy fix này:" -ForegroundColor Yellow
Write-Host "→ Cần xem Railway logs để tìm root cause" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan



Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚨 CRITICAL: Server returning 502" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Vấn đề: Tất cả requests đều trả về 502 Bad Gateway" -ForegroundColor Yellow
Write-Host "Điều này có nghĩa Railway không thể connect đến backend service." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 CÁCH LẤY LOGS ĐỂ DEBUG:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Railway Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "1. Vào Railway Dashboard: https://railway.app" -ForegroundColor White
Write-Host "2. Chọn project 'soulfriend'" -ForegroundColor White
Write-Host "3. Click vào service 'soulfriend'" -ForegroundColor White
Write-Host "4. Click tab 'Deploy Logs'" -ForegroundColor White
Write-Host "5. Scroll xuống và copy 50-100 dòng cuối cùng" -ForegroundColor White
Write-Host "6. Gửi cho tôi để phân tích" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Railway CLI" -ForegroundColor Yellow
Write-Host "1. Mở terminal/PowerShell" -ForegroundColor White
Write-Host "2. Chạy: npm install -g @railway/cli" -ForegroundColor White
Write-Host "3. Chạy: railway login" -ForegroundColor White
Write-Host "4. Chạy: cd backend" -ForegroundColor White
Write-Host "5. Chạy: railway link" -ForegroundColor White
Write-Host "6. Chạy: railway logs --tail 100" -ForegroundColor White
Write-Host "7. Copy output và gửi cho tôi" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Railway API (Advanced)" -ForegroundColor Yellow
Write-Host "Sử dụng token để get logs qua API" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 WHAT TO LOOK FOR IN LOGS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Good Signs:" -ForegroundColor Green
Write-Host "  - '🚀 SoulFriend V4.0 Server Started!'" -ForegroundColor Gray
Write-Host "  - 'Port: XXXX'" -ForegroundColor Gray
Write-Host "  - '✅ MongoDB connected successfully'" -ForegroundColor Gray
Write-Host ""

Write-Host "❌ Bad Signs:" -ForegroundColor Red
Write-Host "  - '❌ Failed to start server'" -ForegroundColor Gray
Write-Host "  - 'Port XXXX is already in use'" -ForegroundColor Gray
Write-Host "  - '❌ Database connection failed'" -ForegroundColor Gray
Write-Host "  - 'Error: Cannot find module'" -ForegroundColor Gray
Write-Host "  - 'TypeError:' hoặc 'SyntaxError:'" -ForegroundColor Gray
Write-Host "  - 'EADDRINUSE'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 FIXES ĐÃ APPLY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ Server start BEFORE database connection" -ForegroundColor Green
Write-Host "2. ✅ Health check endpoint simplified" -ForegroundColor Green
Write-Host "3. ✅ Railway health check timeout increased to 300s" -ForegroundColor Green
Write-Host "4. ✅ CORS middleware set up correctly" -ForegroundColor Green
Write-Host ""

Write-Host "Nếu vẫn 502 sau khi deploy fix này:" -ForegroundColor Yellow
Write-Host "→ Cần xem Railway logs để tìm root cause" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan










