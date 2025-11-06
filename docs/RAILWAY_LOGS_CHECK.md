# 📋 Hướng dẫn Check Railway Logs qua CLI

## Bước 1: Link Railway Project

Nếu chưa link, chạy:
```powershell
railway link
```

Chọn:
- Workspace: **Lê Thị Thanh Uyên's Projects**
- Project: **soulfriend**

## Bước 2: Xem Logs

### Xem tất cả logs gần đây:
```powershell
railway logs --tail 300
```

### Filter logs liên quan đến HITL/CRISIS:
```powershell
railway logs --tail 300 | Select-String -Pattern "CRISIS|HITL|detectCrisis|CRITICAL|ALERT" -CaseSensitive:$false
```

### Xem logs với emoji (debug markers):
```powershell
railway logs --tail 200 | Select-String -Pattern "🔍|🚨|📤|✅|❌"
```

### Xem logs từ test message "tôi muốn chết":
```powershell
railway logs --tail 500 | Select-String -Pattern "tôi muốn chết|muốn chết|muon chet" -CaseSensitive:$false
```

## Bước 3: Phân tích Logs

### Logs cần tìm khi HITL hoạt động:

1. **Crisis Detection:**
   ```
   🔍 CRISIS DETECTION DEBUG:
      Original: "tôi muốn chết"
      Lowercase: "tôi muốn chết"
      Normalized: "toi muon chet"
      ✅ MATCHED: suicidal_ideation (critical)
   ```

2. **Crisis Detected:**
   ```
   🚨 CRISIS DETECTED: suicidal_ideation (critical) - Message: "tôi muốn chết"
   ```

3. **HITL Activation:**
   ```
   🚨 ACTIVATING HITL for crisis: suicidal_ideation
   🚨 CRITICAL ALERT CREATED: ALERT_xxxxx
   🚨 HITL Alert created: ALERT_xxxxx - 5-minute escalation timer started
   ```

4. **Final Response:**
   ```
   📤 FINAL RESPONSE: riskLevel=CRITICAL | crisisLevel=critical | emergencyContacts=1
   ```

## Nếu không thấy logs:

1. **Check xem đã link chưa:**
   ```powershell
   railway status
   ```

2. **Check xem có service nào đang chạy:**
   ```powershell
   railway service
   ```

3. **Xem logs từ service cụ thể:**
   ```powershell
   railway logs --service backend --tail 300
   ```

## Alternative: Railway Dashboard

Nếu CLI không hoạt động, dùng Dashboard:
1. Vào https://railway.app
2. Login và chọn project **soulfriend**
3. Click vào service **backend**
4. Tab **Deployments** → Chọn deployment mới nhất
5. Click **View Logs**
6. Search với keywords: `CRISIS`, `HITL`, `detectCrisis`



