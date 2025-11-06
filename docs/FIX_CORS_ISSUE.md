# 🔧 Fix CORS Issue - Backend AI Unavailable

## 🔍 Vấn đề

Từ console logs trên frontend:
```
Access to fetch at 'https://soulfriend-production.up.railway.app/api/v2/chatbot/message' 
from origin 'https://soulfriend-kendo260599s-projects.vercel.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Backend AI Unavailable**: System đang dùng offline fallback do không thể kết nối backend.

---

## 🔧 Nguyên nhân

1. **CORS Config không đọc từ Environment Variables**
   - Code đang dùng `origin: true` (hardcoded)
   - Không sử dụng `config.CORS_ORIGIN` từ Railway environment

2. **Railway CORS_ORIGIN có thể chưa được set**
   - Frontend URL: `https://soulfriend-kendo260599s-projects.vercel.app`
   - Cần verify trong Railway Variables

---

## ✅ Giải pháp

### 1. **Update CORS Config** (Đã fix)

Đã update `backend/src/index.ts` để:
- ✅ Đọc từ `config.CORS_ORIGIN`
- ✅ Allow requests với no origin
- ✅ Check origin trong allowed list
- ✅ Development mode: allow all origins

### 2. **Verify Railway CORS_ORIGIN Variable**

Railway Variables cần có:
```
CORS_ORIGIN=https://soulfriend-kendo260599s-projects.vercel.app,https://soulfriend.vercel.app,http://localhost:3000
```

### 3. **Redeploy Backend**

Sau khi commit và push, Railway sẽ tự động redeploy.

---

## 📝 Files đã sửa

- ✅ `backend/src/index.ts` - Update CORS config để đọc từ environment

---

## 🚀 Next Steps

1. **Commit và push code:**
   ```bash
   git add backend/src/index.ts
   git commit -m "fix: Update CORS to use environment variables"
   git push
   ```

2. **Verify Railway Variables:**
   - Railway Dashboard → Variables
   - Check `CORS_ORIGIN` có chứa Vercel URL

3. **Test lại:**
   - Refresh frontend
   - Check console không còn CORS errors
   - Test chatbot message

---

## ✅ Kết quả mong đợi

Sau khi fix:
- ✅ Không còn CORS errors trong console
- ✅ Backend AI service available
- ✅ Chatbot có thể gửi/nhận messages
- ✅ Health check pass

---

**Status**: ✅ Fixed  
**Date**: 2025-11-05












