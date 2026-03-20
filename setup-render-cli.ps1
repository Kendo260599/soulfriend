# 🚀 Setup Render CLI và Login với API Key
# API Key: rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ

$RENDER_API_KEY = "rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ"

Write-Host "🚀 Setup Render CLI" -ForegroundColor Green
Write-Host "==================`n" -ForegroundColor Green

# Check if Render CLI is installed
Write-Host "📋 Bước 1: Kiểm tra Render CLI" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

$renderInstalled = Get-Command render -ErrorAction SilentlyContinue

if ($renderInstalled) {
    Write-Host "✅ Render CLI đã được cài đặt" -ForegroundColor Green
    $version = render --version
    Write-Host "   Version: $version`n" -ForegroundColor White
} else {
    Write-Host "❌ Render CLI chưa được cài đặt" -ForegroundColor Red
    Write-Host "`n📋 Bước 2: Cài đặt Render CLI" -ForegroundColor Yellow
    Write-Host "---------------------------------------------------" -ForegroundColor Yellow
    
    Write-Host "Cài đặt Render CLI qua npm:" -ForegroundColor White
    Write-Host "  npm install -g render-cli" -ForegroundColor Cyan
    
    $install = Read-Host "Bạn có muốn cài đặt Render CLI ngay bây giờ? (y/n)"
    
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "`nĐang cài đặt Render CLI..." -ForegroundColor Yellow
        npm install -g render-cli
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Render CLI đã được cài đặt thành công!`n" -ForegroundColor Green
        } else {
            Write-Host "❌ Lỗi khi cài đặt Render CLI" -ForegroundColor Red
            Write-Host "Hãy cài đặt thủ công:" -ForegroundColor Yellow
            Write-Host "  npm install -g render-cli`n" -ForegroundColor Cyan
            exit 1
        }
    } else {
        Write-Host "`n⚠️  Vui lòng cài đặt Render CLI trước:" -ForegroundColor Yellow
        Write-Host "  npm install -g render-cli`n" -ForegroundColor Cyan
        exit 1
    }
}

# Login với API key
Write-Host "📋 Bước 3: Login với API Key" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

Write-Host "Đang login với API key..." -ForegroundColor White
Write-Host "API Key: $RENDER_API_KEY" -ForegroundColor Cyan

# Set API key as environment variable
$env:RENDER_API_KEY = $RENDER_API_KEY

# Login với API key
Write-Host "`nChạy lệnh login:" -ForegroundColor Yellow
Write-Host "  render login --api-key $RENDER_API_KEY" -ForegroundColor Cyan

$login = Read-Host "`nBạn có muốn login ngay bây giờ? (y/n)"

if ($login -eq "y" -or $login -eq "Y") {
    Write-Host "`nĐang login..." -ForegroundColor Yellow
    render login --api-key $RENDER_API_KEY
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đăng nhập thành công!`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi khi đăng nhập" -ForegroundColor Red
        Write-Host "Hãy thử login thủ công:" -ForegroundColor Yellow
        Write-Host "  render login --api-key $RENDER_API_KEY`n" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "`n⚠️  Vui lòng login thủ công:" -ForegroundColor Yellow
    Write-Host "  render login --api-key $RENDER_API_KEY`n" -ForegroundColor Cyan
}

# Verify connection
Write-Host "📋 Bước 4: Kiểm tra kết nối" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

Write-Host "Đang kiểm tra kết nối..." -ForegroundColor White
render whoami

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Kết nối thành công!`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Không thể kết nối" -ForegroundColor Red
    Write-Host "Hãy kiểm tra lại API key và thử lại`n" -ForegroundColor Yellow
    exit 1
}

# List services
Write-Host "📋 Bước 5: Liệt kê Services" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Yellow

Write-Host "Đang liệt kê services..." -ForegroundColor White
render services:list

Write-Host "`n✅ Setup hoàn tất!`n" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

Write-Host "🔗 Useful Commands:" -ForegroundColor Yellow
Write-Host "  render services:list          - Liệt kê tất cả services" -ForegroundColor White
Write-Host "  render services:show <id>    - Xem chi tiết service" -ForegroundColor White
Write-Host "  render logs <service-id>      - Xem logs của service" -ForegroundColor White
Write-Host "  render env:list <service-id>  - Liệt kê env variables" -ForegroundColor White
Write-Host "  render env:set <key>=<value>   - Set env variable" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Kiểm tra service ID: rnd_sPQaZfs9g2eU66SG47PZj4dbDVzJ" -ForegroundColor White
Write-Host "  2. Set environment variables" -ForegroundColor White
Write-Host "  3. Deploy hoặc trigger redeploy`n" -ForegroundColor White
