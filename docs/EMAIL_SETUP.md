# 📧 Email Setup cho HITL Alerts

Hệ thống đã được tích hợp email service để tự động gửi email khi HITL (Human-In-The-Loop) khởi động.

## ✅ Cấu hình đã hoàn thành

1. **Email Service** (`backend/src/services/emailService.ts`)
   - Tích hợp với nodemailer
   - Hỗ trợ SMTP (Gmail, SendGrid, AWS SES, etc.)
   - HTML email templates cho HITL alerts

2. **Critical Intervention Service**
   - Đã thêm email `kendo2605@gmail.com` vào clinical team
   - Tự động gửi email khi:
     - Critical alert được tạo (ngay lập tức)
     - Alert không được acknowledge trong 5 phút (escalation)

## 🔧 Cấu hình SMTP

### Bước 1: Tạo App Password cho Gmail

1. Đăng nhập vào Gmail: https://myaccount.google.com/
2. Vào **Security** → **2-Step Verification** (phải bật trước)
3. Scroll xuống **App passwords**
4. Tạo App Password mới cho "Mail"
5. Copy password (16 ký tự, không có khoảng trắng)

### Bước 2: Set Environment Variables trên Railway

Vào Railway Dashboard → Project → Variables, thêm:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kendo2605@gmail.com
SMTP_PASS=your_16_character_app_password_here
```

**Lưu ý:**
- `SMTP_PASS` phải là **App Password**, không phải mật khẩu Gmail thường
- App Password có 16 ký tự, không có khoảng trắng (ví dụ: `abcd efgh ijkl mnop` → `abcdefghijklmnop`)

### Bước 3: Verify Email Service

Sau khi deploy, check logs:

```bash
railway logs --tail 50 | grep "Email service"
```

Phải thấy:
- `✅ Email service initialized`
- `✅ Email service ready for HITL alerts`

## 📬 Email sẽ được gửi khi:

1. **Critical Alert Created** (ngay lập tức)
   - Subject: `🚨 CRITICAL ALERT: [RISK_TYPE] - [ALERT_ID]`
   - Nội dung: Thông tin chi tiết về alert, user message, keywords

2. **Alert Escalation** (sau 5 phút không có response)
   - Subject: `🚑 URGENT ESCALATION: [RISK_TYPE] - NO RESPONSE FOR 5 MIN`
   - Nội dung: Thông báo alert đã được escalate

## 🧪 Test Email Service

### Test trong development:

```bash
cd backend
npm run dev
```

Check console output:
- `✅ Email service initialized` = OK
- `⚠️  Email service not configured` = Cần set environment variables

### Test gửi email thực tế:

1. Trigger một critical alert bằng cách gửi message có từ khóa:
   - "tôi muốn tự tử"
   - "tôi muốn chết"
   - "tôi muốn tự hại"

2. Check email inbox của `kendo2605@gmail.com`

## 📝 Email Recipients

Hiện tại, email được gửi đến:
- `crisis@soulfriend.vn` (crisis team)
- `kendo2605@gmail.com` (system administrator) ← **Bạn**

Có thể thêm nhiều email khác trong `backend/src/services/criticalInterventionService.ts`:

```typescript
clinicalTeam: [
  {
    id: 'admin_team_1',
    name: 'System Administrator',
    role: 'admin',
    email: 'kendo2605@gmail.com',
    phone: '+84-xxx-xxx-xxx',
    availability: 'available',
  },
  // Thêm team members khác ở đây
],
```

## 🔍 Troubleshooting

### Email không được gửi:

1. **Check environment variables:**
   ```bash
   railway variables
   ```
   Phải có: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

2. **Check logs:**
   ```bash
   railway logs --tail 100 | grep -i email
   ```

3. **Common errors:**
   - `Invalid login`: SMTP_PASS sai hoặc không phải App Password
   - `Connection timeout`: SMTP_HOST hoặc SMTP_PORT sai
   - `Email service not configured`: Thiếu environment variables

### Gmail App Password không hoạt động:

1. Đảm bảo 2-Step Verification đã bật
2. Tạo lại App Password nếu cần
3. Copy chính xác 16 ký tự (không có khoảng trắng)

## 📚 Alternative Email Providers

Nếu không dùng Gmail, có thể dùng:

### SendGrid:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### AWS SES:
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key
SMTP_PASS=your_aws_secret_key
```

### Outlook/Office365:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

## ✅ Checklist

- [x] Email service created
- [x] Critical intervention service updated
- [x] Email `kendo2605@gmail.com` added to clinical team
- [ ] Environment variables set on Railway
- [ ] Email service tested and verified
- [ ] Test critical alert sent successfully




