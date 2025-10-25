# 🔑 Update Gemini API Key - Railway Only

## ✅ ĐÚNG - CHỈ CẦN LÀM:

### **1. Vào Railway Dashboard:**
```
https://railway.app
→ Login
→ soulfriend-production (hoặc tên project của bạn)
→ Tab "Variables"
```

### **2. Tìm GEMINI_API_KEY:**
```
GEMINI_API_KEY = AIzaSyCzt2...cOxk  (key cũ - INVALID)
```

### **3. Click vào value:**
- Click vào giá trị của GEMINI_API_KEY
- **Thay bằng API key mới từ Google AI Studio**
- Click "Update" hoặc nhấn Enter

### **4. Redeploy:**
- Railway sẽ tự động redeploy
- HOẶC click nút "Redeploy" trong Deployments tab

### **5. Verify:**
Sau 2-3 phút, test:
```powershell
curl https://soulfriend-production.up.railway.app/api/v2/chatbot/message `
  -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"message":"Xin chào","sessionId":"test123","userId":"test"}' | ConvertFrom-Json
```

Nếu thấy response có nội dung AI (không phải offline) → ✅ Thành công!

---

## ❌ SAI - KHÔNG CẦN:

### **KHÔNG cần sửa code:**
- ❌ backend/src/services/geminiService.ts
- ❌ backend/.env
- ❌ backend/src/config/environment.ts
- ❌ Bất kỳ file code nào

### **KHÔNG cần Git:**
- ❌ git add
- ❌ git commit
- ❌ git push

### **KHÔNG cần rebuild local:**
- ❌ npm install
- ❌ npm run build

---

## 🎯 TÓM TẮT:

```
✅ Tạo API key mới tại Google AI Studio
✅ Update Railway Variables → GEMINI_API_KEY
✅ Đợi Railway redeploy
✅ Test chatbot

❌ KHÔNG sửa code
❌ KHÔNG commit/push Git
```

---

## 📸 SCREENSHOT CHO RAILWAY:

1. **Variables Tab:**
   ![Variables](https://railway.app/dashboard → Variables)
   
2. **Tìm GEMINI_API_KEY**

3. **Click vào value → Paste key mới**

4. **Save → Redeploy**

---

**⏱️ Thời gian:** 2-3 phút  
**🔧 Cần sửa code:** KHÔNG  
**💰 Chi phí:** MIỄN PHÍ (Google AI Studio Free Tier)









