# 🔍 Hướng dẫn Check Railway Logs cho HITL

## ✅ Phát hiện

1. **Debug endpoint hoạt động:**
   - `/api/v2/chatbot/debug/crisis-test?message=tôi muốn chết`
   - ✅ `detectCrisis()` phát hiện đúng: `crisisDetected: true`, `level: "critical"`

2. **API endpoint có vấn đề:**
   - `/api/v2/chatbot/message` với `"tôi muốn chết"`
   - ❌ Trả về `riskLevel: "LOW"` thay vì `"CRITICAL"`

## 🔍 Cần check Railway Logs

### Cách 1: Railway Dashboard (UI)
1. Vào https://railway.app
2. Chọn project **soulfriend**
3. Click vào service **backend**
4. Vào tab **Deployments** → Chọn deployment mới nhất
5. Click **View Logs**
6. Tìm các dòng:
   - `🔍 CRISIS DETECTION DEBUG:`
   - `✅ MATCHED:` hoặc `❌ NO MATCH`
   - `🚨 CRISIS DETECTED:`
   - `📤 FINAL RESPONSE:`

### Cách 2: Railway CLI
```powershell
# Link project (nếu chưa link)
railway link

# Xem logs
railway logs --tail 200

# Filter logs
railway logs --tail 200 | Select-String -Pattern "CRISIS|detectCrisis|FINAL RESPONSE|HITL" -CaseSensitive:$false
```

## 📝 Những gì cần tìm trong logs

Khi gửi message `"tôi muốn chết"`, logs phải có:

### 1. Crisis Detection Debug:
```
🔍 CRISIS DETECTION DEBUG:
   Original: "tôi muốn chết"
   Lowercase: "tôi muốn chết"
   Normalized: "toi muon chet"
   ✅ MATCHED: suicidal_ideation (critical)
```

### 2. Crisis Detected:
```
🚨 CRISIS DETECTED: suicidal_ideation (critical) - Message: "tôi muốn chết"
```

### 3. HITL Activation (nếu có):
```
🚨 ACTIVATING HITL for crisis: suicidal_ideation
🚨 CRITICAL ALERT CREATED: ALERT_xxxxx
🚨 HITL Alert created: ALERT_xxxxx - 5-minute escalation timer started
```

### 4. Final Response:
```
📤 FINAL RESPONSE: riskLevel=CRITICAL | crisisLevel=critical | emergencyContacts=1
```

## ❌ Nếu logs không có

Nếu logs không có các dòng trên, có thể:
1. Message không được pass đúng vào `detectCrisis()`
2. Có encoding issue
3. Có logic nào đó skip crisis detection

## ✅ Next Steps

1. Check Railway logs với message `"tôi muốn chết"`
2. Copy toàn bộ logs liên quan
3. Phân tích xem `detectCrisis()` có được gọi không
4. Xem `crisisLevel` được set đúng không
5. Fix logic nếu cần




