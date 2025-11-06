# 🔐 Set SMTP Password trên Railway

## ⚠️ QUAN TRỌNG: Bạn cần tự set SMTP_PASS

Tôi đã set 3 variables:
- ✅ `SMTP_HOST=smtp.gmail.com`
- ✅ `SMTP_PORT=587`
- ✅ `SMTP_USER=kendo2605@gmail.com`

**Bạn cần tự set `SMTP_PASS`** (App Password của Gmail):

## Cách 1: Railway Dashboard (UI) - Khuyến nghị

1. Vào https://railway.app
2. Chọn project **soulfriend**
3. Click vào service **backend**
4. Vào tab **Variables**
5. Click **+ New Variable**
6. Key: `SMTP_PASS`
7. Value: `[paste App Password 16 ký tự của bạn]`
8. Click **Add**

## Cách 2: Railway CLI

```powershell
railway variables --set "SMTP_PASS=your_16_character_app_password_here"
```

**Lưu ý:** 
- Thay `your_16_character_app_password_here` bằng App Password thực tế
- App Password là 16 ký tự, không có khoảng trắng
- Ví dụ: `abcdefghijklmnop` (không có dấu cách)

## Tạo Gmail App Password

Nếu chưa có App Password:

1. Vào https://myaccount.google.com/security
2. Bật **2-Step Verification** (nếu chưa)
3. Vào **App passwords** (dưới 2-Step Verification)
4. Chọn app: **Mail**
5. Chọn device: **Other (Custom name)**
6. Nhập tên: `Railway HITL`
7. Click **Generate**
8. Copy password (16 ký tự) → Paste vào Railway

## Verify

Sau khi set `SMTP_PASS`, Railway sẽ tự động redeploy. Check logs:

```powershell
railway logs --tail 50 | Select-String "Email service"
```

Phải thấy:
- ✅ `Email service initialized`
- ✅ `Email service ready for HITL alerts`

## Test

Sau khi email service ready, test bằng cách gửi message critical trong chatbot:
- "tôi muốn tự tử"
- "tôi muốn chết"

Check email `kendo2605@gmail.com` → Sẽ nhận được email alert!





