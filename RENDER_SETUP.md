# Hướng dẫn cấu hình Render cho soulfriend-api

## Vấn đề đã sửa
- **tsconfig.json**: Đổi `outDir` từ `./dist/backend` → `./dist` để output đúng path
- **Entry point**: File compiled nằm tại `backend/dist/backend/src/index.js`

## Cấu hình Render Dashboard (BẮT BUỘC)

Render **không tự động** dùng `render.yaml` cho service đã tạo. Bạn phải cập nhật thủ công:

### Bước 1: Vào Settings
1. Truy cập https://dashboard.render.com
2. Chọn service **soulfriend-api**
3. Click tab **Settings** (bên trái)
4. Cuộn xuống phần **Build & Deploy**

### Bước 2: Kiểm tra cấu hình

| Cài đặt | Giá trị đúng |
|---------|--------------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/backend/src/index.js` |

### Bước 3: Cập nhật Start Command
Nếu Start Command khác với bảng trên:
1. Click **Edit** cạnh Start Command
2. Đổi thành: `node dist/backend/src/index.js`
3. Click **Save Changes**

### Bước 4: Deploy lại
1. Vào tab **Manual Deploy** (góc phải)
2. Chọn **Deploy latest commit**

## Giải thích kỹ thuật
- **rootDir: ".."** trong tsconfig giữ cấu trúc từ project root
- **outDir: "./dist"** → output vào `backend/dist/`
- Entry point: `backend/src/index.ts` → `backend/dist/backend/src/index.js`
- Start command chạy từ thư mục `backend/` nên path là `dist/backend/src/index.js`

## Kiểm tra deploy thành công
Sau khi deploy xong, mở: https://soulfriend-api.onrender.com/api/health

Nếu thấy `{"status":"healthy",...}` là thành công.
