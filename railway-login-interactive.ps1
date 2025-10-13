# 🔐 Railway Interactive Login Script
Write-Host "🔐 Railway Interactive Login" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Có 3 cách để đăng nhập Railway:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🌐 Railway Dashboard (Khuyến nghị)" -ForegroundColor Cyan
Write-Host "   - Mở https://railway.app" -ForegroundColor White
Write-Host "   - Login bằng GitHub" -ForegroundColor White
Write-Host "   - Tạo projects trực tiếp" -ForegroundColor White
Write-Host ""
Write-Host "2. 🔑 Railway CLI với Token" -ForegroundColor Cyan
Write-Host "   - Lấy token từ Railway Dashboard" -ForegroundColor White
Write-Host "   - Settings → Tokens → Create Token" -ForegroundColor White
Write-Host "   - Cung cấp token cho tôi" -ForegroundColor White
Write-Host ""
Write-Host "3. 💻 Railway CLI Interactive" -ForegroundColor Cyan
Write-Host "   - Chạy lệnh: railway login" -ForegroundColor White
Write-Host "   - Mở browser để authenticate" -ForegroundColor White
Write-Host ""

# Option 1: Open Railway Dashboard
Write-Host "🌐 Mở Railway Dashboard..." -ForegroundColor Yellow
Start-Process "https://railway.app"

Write-Host ""
Write-Host "💡 Hướng dẫn lấy token:" -ForegroundColor Yellow
Write-Host "1. Login vào Railway Dashboard" -ForegroundColor White
Write-Host "2. Click vào avatar → Settings" -ForegroundColor White
Write-Host "3. Vào tab 'Tokens'" -ForegroundColor White
Write-Host "4. Click 'Create Token'" -ForegroundColor White
Write-Host "5. Đặt tên: 'SoulFriend Deploy'" -ForegroundColor White
Write-Host "6. Copy token và cung cấp cho tôi" -ForegroundColor White
Write-Host ""

# Option 2: Try Railway CLI login
Write-Host "🔑 Thử Railway CLI login..." -ForegroundColor Yellow
Write-Host "Nếu bạn muốn thử CLI login, hãy chạy lệnh sau trong terminal riêng:" -ForegroundColor Cyan
Write-Host "railway login" -ForegroundColor White
Write-Host ""

# Option 3: Manual token input
Write-Host "📝 Hoặc cung cấp token cho tôi:" -ForegroundColor Yellow
Write-Host "Nếu bạn đã có token, hãy paste vào đây:" -ForegroundColor Cyan
$token = Read-Host "Railway Token"

if ($token -and $token.Length -gt 10) {
    Write-Host "✅ Token received: $($token.Substring(0,8))..." -ForegroundColor Green
    
    # Try to use the token
    $env:RAILWAY_TOKEN = $token
    
    Write-Host "🔍 Testing token..." -ForegroundColor Yellow
    try {
        $result = railway whoami 2>&1
        if ($result -match "Unauthorized") {
            Write-Host "❌ Token không hợp lệ hoặc đã hết hạn" -ForegroundColor Red
        } else {
            Write-Host "✅ Đăng nhập thành công!" -ForegroundColor Green
            Write-Host "👤 User: $result" -ForegroundColor Cyan
            
            # Now we can deploy
            Write-Host ""
            Write-Host "🚀 Bắt đầu deploy..." -ForegroundColor Green
            .\railway-deploy-auto.ps1 -Token $token
        }
    } catch {
        Write-Host "❌ Lỗi khi test token: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Token không hợp lệ" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
