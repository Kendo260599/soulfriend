# 🚀 Quick Setup Email HITL Alerts

## Bước 1: Set Environment Variables trên Railway

### Cách 1: Railway Dashboard (UI)
1. Vào https://railway.app
2. Chọn project **soulfriend-production**
3. Click vào service **backend**
4. Vào tab **Variables**
5. Thêm các variables sau:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = kendo2605@gmail.com
SMTP_PASS = [paste App Password của bạn ở đây - 16 ký tự]
```

### Cách 2: Railway CLI
```bash
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=kendo2605@gmail.com
railway variables set SMTP_PASS=your_app_password_here
```

## Bước 2: Verify

Sau khi set variables, Railway sẽ tự động redeploy. Check logs:

```bash
railway logs --tail 50
```

Tìm dòng:
- ✅ `Email service initialized` = OK
- ✅ `Email service ready for HITL alerts` = Hoàn hảo!

## Bước 3: Test

Gửi message có từ khóa critical trong chatbot:
- "tôi muốn tự tử"
- "tôi muốn chết"

Check email inbox của `kendo2605@gmail.com` → Sẽ nhận được email alert!

## ⚠️ Lưu ý bảo mật

- **KHÔNG** commit App Password vào Git
- **KHÔNG** paste App Password vào chat/email
- Chỉ set trên Railway Variables (encrypted)

## ✅ Checklist

- [ ] Gmail App Password đã tạo (16 ký tự)
- [ ] SMTP_HOST set trên Railway
- [ ] SMTP_PORT set trên Railway  
- [ ] SMTP_USER set trên Railway
- [ ] SMTP_PASS set trên Railway (App Password)
- [ ] Railway đã redeploy
- [ ] Email service ready trong logs
- [ ] Test critical alert thành công




