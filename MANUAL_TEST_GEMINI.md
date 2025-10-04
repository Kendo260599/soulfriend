# 🧪 MANUAL TEST - GEMINI AI

## ✅ API Key Configured!

Your Gemini API key has been added to `backend/.env`

## 🚀 Server Status

The server has been started in a separate window. Check that window for:

### Expected Messages:
```
✅ Gemini AI initialized successfully
Chatbot Service initialized (AI: enabled)
🚀 SoulFriend V4.0 Server Started!
```

If you see errors about API key, the key may be invalid or have restrictions.

---

## 🧪 Manual Testing Steps

### Step 1: Verify Server is Running

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

Expected output:
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "message": "SoulFriend V4.0 API is running successfully!"
}
```

### Step 2: Create Session

```powershell
$session = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/session" `
  -Method Post `
  -Body (@{
    userId = "test_ai_user"
    userProfile = @{ age = 28; lifeStage = "adult" }
  } | ConvertTo-Json) `
  -ContentType "application/json"

$sessionId = $session.data.id
Write-Host "Session ID: $sessionId"
```

### Step 3: Test AI Response

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/message" `
  -Method Post `
  -Body (@{
    message = "Xin chào, tôi cảm thấy hơi lo âu gần đây"
    userId = "test_ai_user"
    sessionId = $sessionId
  } | ConvertTo-Json) `
  -ContentType "application/json"

Write-Host "`nAI Response:" -ForegroundColor Cyan
Write-Host $response.data.message -ForegroundColor White
Write-Host "`nAI Generated: $($response.data.aiGenerated)" -ForegroundColor $(if ($response.data.aiGenerated) { "Green" } else { "Yellow" })
Write-Host "Confidence: $($response.data.confidence)" -ForegroundColor Gray
```

### Expected Result with AI:
```
AI Response: Chào bạn! Mình hiểu cảm giác lo âu có thể rất khó chịu. 
Bạn có thể chia sẻ thêm về điều gì đang khiến bạn lo lắng không? 
Mình ở đây để lắng nghe bạn. 💙

AI Generated: True
Confidence: 0.85
```

### Step 4: Test Complex Emotion

```powershell
$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/message" `
  -Method Post `
  -Body (@{
    message = "Tôi cảm thấy rất mệt mỏi với cuộc sống"
    userId = "test_ai_user"
    sessionId = $sessionId
  } | ConvertTo-Json) `
  -ContentType "application/json"

Write-Host "`nAI Response 2:" -ForegroundColor Cyan
Write-Host $response2.data.message -ForegroundColor White
Write-Host "`nRisk Level: $($response2.data.riskLevel)" -ForegroundColor Yellow
```

### Step 5: Check Conversation History

```powershell
$history = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/chatbot/history/$sessionId" -Method Get

Write-Host "`nConversation History:" -ForegroundColor Cyan
foreach ($msg in $history.data.messages) {
    Write-Host "[$($msg.sender)]: $($msg.content.Substring(0, [Math]::Min(60, $msg.content.Length)))..." -ForegroundColor Gray
}
```

---

## 🔍 Troubleshooting

### Issue: "AI Generated: False"

**Possible Causes:**
1. API key invalid or expired
2. API key has restrictions (check Google Console)
3. Gemini service failed to initialize

**Check server logs for:**
```
✅ Gemini AI initialized successfully  <- Should see this
⚠️  Gemini API key not found           <- Should NOT see this
```

### Issue: Server not responding

**Solutions:**
```powershell
# Check if port 5000 is in use
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Restart server
cd backend
npm start
```

### Issue: API errors

**Check API key permissions:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Check if API key has restrictions
3. Ensure "Generative Language API" is enabled

---

## ✅ Success Indicators

### 1. Server Logs Show:
- ✅ Gemini AI initialized successfully
- ✅ Chatbot Service initialized (AI: enabled)

### 2. API Responses Show:
- ✅ `aiGenerated: true`
- ✅ Natural, conversational Vietnamese
- ✅ Longer responses (100+ words)
- ✅ Contextual understanding

### 3. Response Quality:
- ✅ Empathetic and warm tone
- ✅ Asks follow-up questions
- ✅ Provides actionable suggestions
- ✅ Uses emojis appropriately (💙 🌸)

---

## 📊 Compare AI vs Rule-based

### Rule-based (Fallback):
```
User: "Tôi cảm thấy lo âu"
Bot: "Cảm ơn bạn đã chia sẻ. Tôi ở đây để lắng nghe..."
```
- Short
- Template-based
- Generic

### AI-powered (Gemini):
```
User: "Tôi cảm thấy lo âu"
Bot: "Chào bạn! Mình hiểu cảm giác lo âu có thể rất khó chịu. 
     Bạn có thể chia sẻ thêm về điều gì đang khiến bạn lo lắng không? 
     Mình ở đây để lắng nghe bạn. 💙"
```
- Natural
- Contextual
- Empathetic

---

## 🎯 Next Steps

Once AI is confirmed working:

1. **Test various scenarios**
   - General conversation
   - Crisis detection
   - Test recommendations
   - Relaxation guidance

2. **Monitor performance**
   - Response time (should be < 3s)
   - Token usage
   - Error rates

3. **Collect quality metrics**
   - User satisfaction
   - Response accuracy
   - Conversation flow

4. **Phase 2 continues**
   - Implement RAG system
   - Enhance crisis detection
   - Add personalization

---

## 📞 Need Help?

### Check Server Logs
Look at the server window for detailed logs

### Test API Manually
Use the commands above one by one

### Verify Configuration
```powershell
cd backend
Get-Content .env | Select-String "GEMINI_API_KEY"
# Should show: GEMINI_API_KEY=AIza***...
```

### Run Full Test Script
```powershell
.\test-gemini-integration.ps1
```

---

**🎉 Happy Testing!**

The AI-powered chatbot is ready to provide empathetic, intelligent support!

