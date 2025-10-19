# 🔧 GEMINI API KEY UPDATE REQUIRED

## ❌ **VẤN ĐỀ HIỆN TẠI:**
- ❌ **Same Response**: Tất cả messages đều trả về cùng response
- ❌ **Fallback Mode**: Backend đang sử dụng offline responses
- ❌ **API Key**: Chưa được cập nhật trong Railway

## 🎯 **GIẢI PHÁP:**

### **BƯỚC 1: Cập nhật API Key trong Railway**

#### **1.1. Truy cập Railway Dashboard:**
- 🌐 **URL**: https://railway.app/dashboard
- 🔍 **Tìm**: Project "soulfriend"
- ⚙️ **Click**: Service settings

#### **1.2. Cập nhật Environment Variables:**
- 📝 **Tìm**: `GEMINI_API_KEY`
- ✏️ **Thay đổi**: `AIzaSyDBxsHJ7kPEBVrLIInjKfIGs8zQ3TBE8zQ`
- 💾 **Save**: Lưu thay đổi

#### **1.3. Restart Service:**
- 🔄 **Redeploy**: Trigger new deployment
- ⏳ **Wait**: 2-3 phút để restart

---

### **BƯỚC 2: Kiểm tra Logs**

#### **2.1. Xem Railway Logs:**
- 📝 **Tab**: "Logs"
- 🔍 **Tìm**: Gemini initialization messages
- ✅ **Expected**: "✅ Gemini AI initialized successfully"

#### **2.2. Kiểm tra Errors:**
- ❌ **Look for**: API key errors
- ❌ **Look for**: Rate limit errors
- ❌ **Look for**: Model access errors

---

### **BƯỚC 3: Test API Key**

#### **3.1. Test Health Check:**
```bash
curl https://soulfriend-production.up.railway.app/api/health
```

#### **3.2. Test Chatbot:**
```bash
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Origin: https://soulfriend-kendo260599s-projects.vercel.app" \
  -d '{"message":"Xin chào, test API key mới","sessionId":"test-new-key","userId":"test"}'
```

---

## 🚨 **NẾU VẪN KHÔNG HOẠT ĐỘNG:**

### **1. Kiểm tra API Key Validity:**
- 🔑 **Test Key**: https://makersuite.google.com/app/apikey
- ✅ **Verify**: Key có hoạt động không
- 📊 **Check**: Quotas và limits

### **2. Kiểm tra Model Access:**
- 🤖 **Model**: `gemini-pro` (free tier)
- 🔄 **Fallback**: `gemini-1.0-pro`, `gemini-1.5-pro`
- ⚠️ **Note**: Một số models cần paid tier

### **3. Debug Backend Code:**
- 📁 **File**: `backend/src/services/geminiService.ts`
- 🔍 **Check**: Error handling logic
- 📝 **Logs**: Xem detailed error messages

---

## 📋 **CHECKLIST:**

### **Railway Configuration:**
- ✅ **GEMINI_API_KEY**: `AIzaSyDBxsHJ7kPEBVrLIInjKfIGs8zQ3TBE8zQ`
- ✅ **NODE_ENV**: `production`
- ✅ **Service**: Restarted after key update

### **Expected Logs:**
- ✅ **"✅ Gemini AI initialized successfully with gemini-pro"**
- ✅ **"📊 Gemini requests: 1/12 in current minute"**
- ✅ **No API key errors**

### **Test Results:**
- ✅ **Different responses** for different messages
- ✅ **Contextual responses** based on user input
- ✅ **No fallback responses**

---

## 🚀 **NEXT STEPS:**

### **1. Update Railway:**
- Cập nhật API key trong Railway
- Restart service
- Check logs

### **2. Test Again:**
- Test với messages khác nhau
- Verify responses khác nhau
- Check console logs

### **3. If Still Issues:**
- Check API key validity
- Check model access
- Debug backend code

---

**Cần cập nhật API key trong Railway và restart service!** 🚀
