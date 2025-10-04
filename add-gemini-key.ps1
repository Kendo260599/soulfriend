# Quick Script to Add Gemini API Key
# Run: .\add-gemini-key.ps1

Write-Host "`n🔑 ADD GEMINI API KEY TO .ENV`n" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ backend\.env not found!" -ForegroundColor Red
    Write-Host "Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ .env file created!`n" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found either!" -ForegroundColor Red
        exit 1
    }
}

# Prompt for API key
Write-Host "Enter your Gemini API key:" -ForegroundColor Yellow
Write-Host "(Get it from: https://makersuite.google.com/app/apikey)" -ForegroundColor Gray
$apiKey = Read-Host "API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "`n❌ No API key provided!" -ForegroundColor Red
    exit 1
}

# Validate format (basic check)
if ($apiKey -notmatch '^AIza[A-Za-z0-9_-]+$') {
    Write-Host "`n⚠️  Warning: API key format looks unusual." -ForegroundColor Yellow
    Write-Host "   Gemini keys usually start with 'AIza'" -ForegroundColor Gray
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check if key already exists
$envContent = Get-Content "backend\.env" -Raw
if ($envContent -match 'GEMINI_API_KEY=') {
    Write-Host "`n⚠️  GEMINI_API_KEY already exists in .env" -ForegroundColor Yellow
    $replace = Read-Host "Replace it? (y/n)"
    
    if ($replace -eq 'y') {
        # Replace existing key
        $envContent = $envContent -replace 'GEMINI_API_KEY=.*', "GEMINI_API_KEY=$apiKey"
        Set-Content "backend\.env" $envContent
        Write-Host "`n✅ API key updated!" -ForegroundColor Green
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    # Add new key
    Add-Content "backend\.env" "`nGEMINI_API_KEY=$apiKey"
    Write-Host "`n✅ API key added to .env!" -ForegroundColor Green
}

# Verify
Write-Host "`n🔍 Verifying..." -ForegroundColor Yellow
$newContent = Get-Content "backend\.env" -Raw
if ($newContent -match "GEMINI_API_KEY=$apiKey") {
    Write-Host "✅ Verification successful!`n" -ForegroundColor Green
    
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        API KEY CONFIGURED! ✅          ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    
    Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start server:" -ForegroundColor White
    Write-Host "     cd backend && npm start" -ForegroundColor Gray
    Write-Host "`n  2. Test AI integration:" -ForegroundColor White
    Write-Host "     .\test-gemini-integration.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Verification failed!" -ForegroundColor Red
    Write-Host "Please check backend\.env manually" -ForegroundColor Yellow
}

