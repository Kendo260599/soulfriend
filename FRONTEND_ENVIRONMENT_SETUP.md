# Frontend Environment Setup Guide

## Kết nối Frontend (Vercel) ↔ Backend (Railway)

### 📋 Biến Môi Trường Cần Thiết

Frontend sử dụng các biến môi trường sau để kết nối với backend:

| Biến | Mô tả | Giá trị Production | Giá trị Development |
|------|-------|-------------------|---------------------|
| `REACT_APP_API_URL` | URL backend chính | Railway URL | `http://localhost:5000` |
| `REACT_APP_BACKEND_URL` | URL backend chatbot | Railway URL | `http://localhost:5000` |

---

## 🔧 Hướng Dẫn Cấu Hình

### **1. Lấy Backend URL từ Railway**

1. Vào [Railway Dashboard](https://railway.app)
2. Chọn project `soulfriend`
3. Click vào service **Backend**
4. Tab **Settings** → **Networking**
5. Copy **Public Domain** (ví dụ: `https://soulfriend-backend-production.up.railway.app`)

---

### **2. Cấu hình CORS trong Backend (Railway)**

Backend cần cho phép frontend Vercel truy cập:

1. **Vào Railway** → Backend service → Tab **Variables**
2. **Thêm/Cập nhật:**
   ```
   Name: CORS_ORIGIN
   Value: https://your-frontend.vercel.app,http://localhost:3000
   ```
   
   ⚠️ **Lưu ý:**
   - Thay `https://your-frontend.vercel.app` bằng URL Vercel thật
   - Ngăn cách bằng dấu phẩy (`,`), không có khoảng trắng
   - Bao gồm cả `localhost` để test local

3. **Save** → Railway sẽ auto-redeploy

---

### **3. Cấu hình Environment Variables trong Vercel**

1. **Vào [Vercel Dashboard](https://vercel.com)**
2. Chọn project frontend
3. **Settings** → **Environment Variables**

4. **Thêm biến thứ nhất:**
   ```
   Name:         REACT_APP_API_URL
   Value:        https://YOUR-RAILWAY-URL.railway.app
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click **Save**

5. **Thêm biến thứ hai:**
   ```
   Name:         REACT_APP_BACKEND_URL
   Value:        https://YOUR-RAILWAY-URL.railway.app
   Environments: ✓ Production  ✓ Preview  ✓ Development
   ```
   Click **Save**

6. **Redeploy:**
   - Tab **Deployments**
   - Click menu "**...**" ở deployment mới nhất
   - Click **Redeploy**
   - Đợi 2-3 phút

---

## ✅ Kiểm Tra Kết Nối

### **1. Test Backend Health**

```bash
curl https://YOUR-RAILWAY-URL.railway.app/api/health
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "message": "SoulFriend V4.0 API is running successfully!",
  "version": "4.0.0"
}
```

### **2. Test Frontend → Backend**

1. Mở frontend trên Vercel: `https://your-app.vercel.app`
2. Mở **DevTools** (F12) → **Console**
3. Kiểm tra không có lỗi CORS:
   - ❌ `Access to XMLHttpRequest ... has been blocked by CORS policy`
   - ✅ API calls thành công

### **3. Test Chatbot**

1. Vào trang chatbot trên frontend
2. Gửi tin nhắn thử
3. Kiểm tra response từ backend

---

## 🐛 Troubleshooting

### **Lỗi CORS**

```
Access-Control-Allow-Origin error
```

**Giải pháp:**
- Kiểm tra `CORS_ORIGIN` trong Railway có chứa URL Vercel chưa
- Đảm bảo không có khoảng trắng trong `CORS_ORIGIN`
- Redeploy backend sau khi thay đổi

### **Lỗi Network/Timeout**

```
Network Error / Request timeout
```

**Giải pháp:**
- Kiểm tra backend Railway đang chạy (xem logs)
- Test health endpoint trực tiếp
- Kiểm tra `REACT_APP_API_URL` có đúng không

### **Lỗi 404 Not Found**

```
404 on /api/... endpoints
```

**Giải pháp:**
- Kiểm tra endpoint path trong frontend
- Backend routes phải bắt đầu với `/api`
- Xem logs Railway để debug

---

## 📝 Local Development

### **Tạo file `.env.local`** (Không commit)

```bash
# Frontend root directory
cd frontend
touch .env.local
```

Nội dung `.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BACKEND_URL=http://localhost:5000
```

### **Chạy local:**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

---

## 🚀 URLs Mẫu

### **Production:**
- **Frontend (Vercel):** `https://soulfriend.vercel.app`
- **Backend (Railway):** `https://soulfriend-backend-production.up.railway.app`
- **API Health:** `https://soulfriend-backend-production.up.railway.app/api/health`

### **Development:**
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:5000`
- **API Health:** `http://localhost:5000/api/health`

---

## 📚 Tham Khảo

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

