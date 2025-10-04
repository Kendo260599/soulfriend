# 🚀 QUICK START - PHASE 2 AI INTEGRATION

## Bước 1: Thêm Gemini API Key

### Cách 1: Edit file trực tiếp
1. Mở file: `backend/.env`
2. Thêm dòng này:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

### Cách 2: Dùng PowerShell
```powershell
# Nhập key của bạn
$apiKey = Read-Host "Enter your Gemini API key"

# Thêm vào .env
Add-Content backend\.env "`nGEMINI_API_KEY=$apiKey"
```

### Lấy API Key
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập với Google account
3. Click "Create API Key"
4. Copy key (bắt đầu với `AIza...`)

---

## Bước 2: Khởi động Server

```powershell
# Build backend
cd backend
npm run build

# Start server
npm start
```

Hoặc development mode với auto-reload:
```powershell
cd backend
npm run dev
```

---

## Bước 3: Test AI Integration

```powershell
# Chạy test script
.\test-gemini-integration.ps1
```

### Test thủ công với curl

**Test 1: Create Session**
```powershell
$session = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/session" -Method Post -Body (@{
    userId = "test_user"
    userProfile = @{ age = 28; lifeStage = "adult" }
} | ConvertTo-Json) -ContentType "application/json"

$sessionId = $session.data.id
```

**Test 2: Send Message (AI Response)**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/message" -Method Post -Body (@{
    message = "Xin chào, tôi cảm thấy hơi lo âu"
    userId = "test_user"
    sessionId = $sessionId
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "AI Response: $($response.data.message)"
Write-Host "AI Generated: $($response.data.aiGenerated)"
```

---

## Bước 4: Verify AI is Working

Kiểm tra log của server, bạn sẽ thấy:
```
✅ Gemini AI initialized successfully
Chatbot Service initialized (AI: enabled)
```

Nếu thấy:
```
⚠️  Gemini API key not found. AI features will be disabled.
Chatbot Service initialized (AI: disabled)
```

→ API key chưa được config đúng.

---

## Troubleshooting

### Problem: "API key not found"
**Solution**:
1. Check `.env` file exists in `backend/` folder
2. Check line: `GEMINI_API_KEY=...` exists
3. No quotes needed: `GEMINI_API_KEY=AIzaSy...`
4. Restart server after adding key

### Problem: "Invalid API key"
**Solution**:
1. Verify key from: https://makersuite.google.com/app/apikey
2. Make sure key starts with `AIza`
3. Check for extra spaces in .env file

### Problem: Server not starting
**Solution**:
```powershell
# Check if port 5000 is in use
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Kill process if needed
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Start again
cd backend
npm start
```

---

## Expected Results

### With API Key (AI Enabled) ✅
- Responses are natural and conversational
- Longer, more empathetic messages
- Context-aware conversations
- `aiGenerated: true` in response

### Without API Key (Fallback) 🔄
- Responses are rule-based
- Shorter, template-based messages
- Less context awareness
- `aiGenerated: false` in response

---

## What's Different with AI?

### Before (Rule-based)
```
User: "Tôi cảm thấy lo âu"
Bot: "Cảm ơn bạn đã chia sẻ. Tôi ở đây để lắng nghe..."
```

### After (AI-powered)
```
User: "Tôi cảm thấy lo âu"
Bot: "Chào bạn, mình hiểu cảm giác lo âu có thể rất khó chịu. 
     Bạn có thể chia sẻ thêm về điều gì đang khiến bạn lo lắng không? 
     Mình ở đây để lắng nghe bạn. 💙"
```

---

## Next Steps

Once AI is working:

1. **Test different scenarios**
   - General conversation
   - Crisis detection
   - Test recommendations
   - Relaxation skills

2. **Monitor performance**
   - Response time
   - Token usage
   - Error rates

3. **Collect feedback**
   - Response quality
   - User satisfaction
   - Accuracy

4. **Phase 2 continues**
   - RAG implementation
   - Enhanced crisis detection
   - Personalization engine

---

## Need Help?

### Check Logs
```powershell
# Backend logs
cd backend
npm start
# Watch for initialization messages
```

### Test Health
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health/detailed"
```

### Check Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/stats"
```

---

**🎉 Have fun testing the AI-powered chatbot!**

**Questions?** Check `PHASE2_PROGRESS.md` for detailed information.

