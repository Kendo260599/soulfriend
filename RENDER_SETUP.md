# Hướng dẫn cấu hình Render cho soulfriend-api

## Nguyên nhân lỗi MODULE_NOT_FOUND (sửa mãi vẫn lỗi)

### Vì sao fix liên tục vẫn lỗi?

1. **Render Dashboard lưu cấu hình riêng**  
   Service `soulfriend-api` có thể được tạo thủ công qua Dashboard. Khi đó, **Build Command** và **Start Command** được lưu trong Render, **không tự động lấy từ** `render.yaml` hay `package.json`. Thay đổi trong repo không có tác dụng nếu Dashboard vẫn dùng cấu hình cũ.

2. **Start Command không khớp với output thực tế**  
   - Render hay dùng: `node dist/index.js`  
   - Nhưng TypeScript build ra: `dist/backend/src/index.js`  
   - Path không trùng → `MODULE_NOT_FOUND`

3. **Postbuild phải chạy thành công**  
   Script `scripts/postbuild.js` tạo file `dist/index.js` (shim). Nếu build fail trước bước này, `dist/index.js` sẽ không tồn tại.

## Giải pháp đã áp dụng

- **Postbuild**: Tự tạo `dist/index.js` trỏ tới entry point thật.
- **npm start**: Dùng `node dist/index.js` (shim) — hoạt động với mọi cấu hình.
- **render.yaml**: `startCommand: npm start` để thống nhất cách chạy.

## Cấu hình Render Dashboard (bắt buộc kiểm tra)

Render có thể **không dùng** `render.yaml` cho service tạo thủ công. Cần kiểm tra trong Dashboard:

### Bước 1: Vào Settings

1. https://dashboard.render.com
2. Chọn service **soulfriend-api**
3. Tab **Settings** → phần **Build & Deploy**

### Bước 2: Kiểm tra/đặt đúng cấu hình

| Cài đặt | Giá trị đúng |
|---------|--------------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` hoặc `node dist/index.js` |

### Bước 3: Lưu và deploy lại

1. **Save Changes** nếu có thay đổi
2. Tab **Manual Deploy** → **Deploy latest commit**

## Chẩn đoán khi vẫn lỗi

### 1. Xem build logs

- Tab **Logs** hoặc **Events**
- Kiểm tra có dòng `✓ Created dist/index.js shim` không
- Nếu không có → postbuild không chạy hoặc build fail trước đó

### 2. Kiểm tra Start Command

- Logs hiển thị command thực thi, ví dụ: `==> Running 'node dist/index.js'`
- Nếu là `node dist/index.js` nhưng build đã chạy postbuild → shim phải tồn tại
- Nếu lỗi vẫn còn → kiểm tra **Root Directory** có đúng là `backend` không

### 3. Kiểm tra Root Directory

- Nếu Root Directory sai (ví dụ để trống hoặc sai thư mục):
  - Build có thể chạy sai thư mục
  - `dist/` không được tạo đúng vị trí
- Root phải là `backend` vì build script và entry point nằm trong đó

### 4. Đã push code mới chưa?

- Postbuild nằm trong repo — Render chỉ build code đã push
- Nếu chưa push → Render vẫn build bản cũ, không có shim

## Kiểm tra deploy thành công

Mở: https://soulfriend-api.onrender.com/api/health

Thấy `{"status":"healthy",...}` là thành công.

## Kiểm tra local trước khi push

```bash
cd backend
npm run build
# Phải thấy: ✓ Created dist/index.js shim
node dist/index.js
# Server khởi động (cần NODE_ENV=production hoặc development)
```
