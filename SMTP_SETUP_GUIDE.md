# 📧 Hướng Dẫn Cấu Hình Email Alert cho HITL System

## 🎯 Mục đích

Hệ thống HITL (Human-In-The-Loop) cần gửi email cảnh báo ngay lập tức đến đội ngũ y tế khi phát hiện nguy cơ tự tử hoặc khủng hoảng tâm lý nghiêm trọng.

---

## 📋 Tùy chọn SMTP

### ✅ **Option 1: Gmail (Khuyến nghị cho Development)**

#### Ưu điểm:
- ✅ Miễn phí
- ✅ Dễ thiết lập (5 phút)
- ✅ Tin cậy cao
- ✅ Hỗ trợ 2FA

#### Hạn chế:
- ⚠️ Giới hạn 500 emails/ngày
- ⚠️ Không phù hợp cho production quy mô lớn

#### Các bước thiết lập:

##### **Bước 1: Tạo Gmail App Password**

1. Truy cập: https://myaccount.google.com/apppasswords
2. Đăng nhập với tài khoản Gmail của bạn
3. Chọn **"Mail"** làm ứng dụng
4. Chọn **"Other (Custom name)"** làm thiết bị
5. Nhập tên: `SOULFRIEND HITL Alerts`
6. Click **"Generate"**
7. Copy password 16 ký tự (dạng: `xxxx xxxx xxxx xxxx`)

**Lưu ý quan trọng:**
- ⚠️ Phải bật 2-Step Verification trước
- ⚠️ Lưu password ngay, không xem lại được
- ⚠️ Không share password này cho ai

##### **Bước 2: Cấu hình `.env`**

Mở file `backend/.env` và thêm:

```env
# 📧 EMAIL NOTIFICATIONS (HITL Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=SOULFRIEND Crisis Team <your-email@gmail.com>

# Alert Recipients (comma-separated)
ALERT_EMAILS=doctor1@hospital.com,doctor2@hospital.com,admin@soulfriend.com
```

**Thay thế:**
- `your-email@gmail.com` → Email Gmail của bạn
- `xxxx xxxx xxxx xxxx` → App Password vừa tạo
- `ALERT_EMAILS` → Danh sách email nhận cảnh báo

##### **Bước 3: Test Email**

```bash
cd backend

# Test với TypeScript
npm run test:email your-test-email@gmail.com

# Hoặc sau khi build
npm run build
node dist/scripts/testEmail.js your-test-email@gmail.com
```

**Kết quả mong đợi:**
```
🧪 Testing Email Service...

✅ Email service configured

🔌 Testing SMTP connection...
✅ SMTP connection successful

📧 Sending test email...
✅ Test email sent successfully!

📬 Check inbox: your-test-email@gmail.com
📧 Check spam folder if not in inbox

🎉 Email service is READY for HITL alerts!
```

---

### ✅ **Option 2: SendGrid (Khuyến nghị cho Production)**

#### Ưu điểm:
- ✅ Free tier: 100 emails/ngày
- ✅ Paid: từ 40,000 emails/tháng ($19.95/tháng)
- ✅ Deliverability cao (99%+)
- ✅ Analytics chi tiết
- ✅ API mạnh mẽ

#### Các bước thiết lập:

##### **Bước 1: Tạo tài khoản SendGrid**

1. Truy cập: https://signup.sendgrid.com/
2. Sign up (Free tier)
3. Verify email

##### **Bước 2: Tạo API Key**

1. Vào **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name: `SOULFRIEND HITL Alerts`
4. Permissions: **Full Access** hoặc **Restricted Access** (chỉ Mail Send)
5. Click **"Create & View"**
6. **Copy API Key** (chỉ hiện 1 lần!)

##### **Bước 3: Verify Sender Identity**

1. Vào **Settings** → **Sender Authentication**
2. Chọn **Single Sender Verification**
3. Nhập thông tin:
   - From Name: `SOULFRIEND Crisis Team`
   - From Email: `alerts@yourdomain.com` (hoặc Gmail của bạn)
   - Reply To: Email support của bạn
4. Verify email được gửi đến hộp thư

##### **Bước 4: Cấu hình `.env`**

```env
# 📧 EMAIL NOTIFICATIONS (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=SOULFRIEND Crisis Team <alerts@yourdomain.com>

# Alert Recipients
ALERT_EMAILS=doctor@hospital.com,crisis-team@hospital.com
```

**Lưu ý:**
- `SMTP_USER` luôn là `apikey` (không thay đổi)
- `SMTP_PASS` là API Key vừa tạo (bắt đầu với `SG.`)

##### **Bước 5: Test**

```bash
npm run test:email recipient@email.com
```

---

### ✅ **Option 3: Amazon SES (Rẻ nhất cho Production)**

#### Ưu điểm:
- ✅ $0.10 per 1,000 emails (rất rẻ!)
- ✅ Scalability cao
- ✅ Tích hợp AWS ecosystem

#### Hạn chế:
- ⚠️ Phức tạp hơn để setup
- ⚠️ Cần verify domain (recommended)
- ⚠️ Sandbox mode ban đầu (50 emails/day)

#### Các bước thiết lập:

##### **Bước 1: Tạo AWS Account & SES**

1. Đăng ký AWS: https://aws.amazon.com/
2. Vào **Amazon SES Console**
3. Chọn region (us-east-1 recommended)

##### **Bước 2: Verify Email/Domain**

**Option A: Verify Email (nhanh)**
1. **Email Addresses** → **Verify a New Email Address**
2. Nhập email, verify qua email confirmation

**Option B: Verify Domain (production)**
1. **Domains** → **Verify a New Domain**
2. Thêm DNS records (TXT, CNAME) vào domain của bạn
3. Chờ verification (vài giờ)

##### **Bước 3: Request Production Access**

1. Vào **Account Dashboard**
2. Click **"Request Production Access"**
3. Điền form (use case, volume estimate)
4. Chờ approval (24-48 giờ)

##### **Bước 4: Tạo SMTP Credentials**

1. **SMTP Settings** → **Create My SMTP Credentials**
2. IAM User Name: `soulfriend-ses-smtp`
3. Click **Create**
4. **Download credentials** (CSV file)

##### **Bước 5: Cấu hình `.env`**

```env
# 📧 EMAIL NOTIFICATIONS (Amazon SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=SOULFRIEND Crisis Team <alerts@yourdomain.com>

# Alert Recipients
ALERT_EMAILS=doctor@hospital.com
```

**Thay region nếu cần:**
- `us-east-1` (N. Virginia) - mặc định
- `ap-southeast-1` (Singapore) - gần VN hơn
- `eu-west-1` (Ireland)

##### **Bước 6: Test**

```bash
npm run test:email recipient@email.com
```

---

### ✅ **Option 4: Mailgun**

#### Ưu điểm:
- ✅ Free: 5,000 emails/month (3 months)
- ✅ API đơn giản
- ✅ Good deliverability

#### Setup:

1. Sign up: https://www.mailgun.com/
2. Verify domain hoặc use Mailgun sandbox
3. Get SMTP credentials từ **Sending** → **Domain settings**
4. Configure `.env`:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

---

## 🧪 Testing Email Service

### **Test 1: Connection Test**

```bash
cd backend
npm run test:email your-email@gmail.com
```

### **Test 2: Gửi Crisis Alert thật**

```bash
# Start backend
npm run dev

# Trigger crisis message
curl -X POST http://localhost:5000/api/v2/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn chết",
    "sessionId": "test_session",
    "userId": "test_user"
  }'
```

**Kết quả:**
- Backend log: `✅ Crisis alert email sent`
- Email inbox: Nhận được email cảnh báo trong vài giây

---

## 📊 So sánh các tùy chọn

| Tính năng | Gmail | SendGrid | Amazon SES | Mailgun |
|-----------|-------|----------|------------|---------|
| **Giá** | Free | Free-$20/mo | $0.10/1k | Free-$35/mo |
| **Free Tier** | 500/day | 100/day | 62k/mo | 5k/mo |
| **Setup Time** | 5 min | 15 min | 30 min | 15 min |
| **Deliverability** | Good | Excellent | Excellent | Good |
| **Analytics** | No | Yes | Yes | Yes |
| **Scale** | Low | High | Very High | High |
| **Best For** | Dev/Test | Production | Enterprise | Startups |

---

## 🎯 Khuyến nghị

### **Development/Testing:**
→ **Gmail** (nhanh, dễ, miễn phí)

### **Production nhỏ (< 10k emails/tháng):**
→ **SendGrid Free** hoặc **Mailgun**

### **Production lớn (> 10k emails/tháng):**
→ **Amazon SES** (rẻ nhất)

### **Enterprise:**
→ **SendGrid Pro** hoặc **Amazon SES** + SNS

---

## ⚠️ Troubleshooting

### **Lỗi: "Invalid credentials"**

```bash
# Check credentials
echo $SMTP_USER
echo $SMTP_PASS

# Gmail: Đảm bảo dùng App Password, không phải mật khẩu thường
# SendGrid: SMTP_USER phải là "apikey"
# SES: Check IAM permissions
```

### **Lỗi: "Connection timeout"**

```bash
# Check firewall
telnet smtp.gmail.com 587

# Nếu không kết nối được:
# 1. Check firewall settings
# 2. Try port 465 (SSL) thay vì 587 (TLS)
# 3. Check VPN/proxy
```

### **Email vào spam folder**

**Giải pháp:**
1. ✅ Verify sender domain (SPF, DKIM, DMARC)
2. ✅ Use professional domain thay vì Gmail
3. ✅ Avoid spam trigger words
4. ✅ Include unsubscribe link
5. ✅ Warm up email (start slow, increase gradually)

### **Lỗi: "Daily limit exceeded" (Gmail)**

```bash
# Gmail limit: 500 emails/day
# Giải pháp:
# 1. Upgrade to SendGrid/SES
# 2. Use multiple Gmail accounts
# 3. Implement rate limiting
```

---

## 📧 Email Template Customization

Customize email templates trong `backend/src/services/emailService.ts`:

```typescript
// Line ~200-300
private formatCrisisAlertEmail(alert: CriticalAlert): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Your custom styles */
      </style>
    </head>
    <body>
      <!-- Your custom HTML -->
    </body>
    </html>
  `;
}
```

---

## 🔐 Security Best Practices

1. **Never commit credentials to Git**
   ```bash
   # Check .gitignore includes .env
   cat .gitignore | grep .env
   ```

2. **Use environment variables**
   - ✅ `.env` for local dev
   - ✅ Platform secrets for production (Railway, Heroku, etc.)

3. **Rotate credentials regularly**
   - Every 90 days recommended

4. **Monitor email sending**
   - Set up alerts for failed sends
   - Track bounce rates

5. **Implement rate limiting**
   - Prevent abuse
   - Respect SMTP limits

---

## 🚀 Next Steps

1. ✅ **Cấu hình SMTP** (chọn provider phù hợp)
2. ✅ **Test email** (`npm run test:email`)
3. ✅ **Verify trong production**
4. ✅ **Train clinical team** (check inbox regularly)
5. ✅ **Set up monitoring** (email delivery rates)
6. ✅ **Document procedures** (emergency contacts)

---

## 📞 Support

**Lỗi kỹ thuật:**
- Check logs: `pm2 logs` hoặc `npm run dev`
- Email service logs: `backend/logs/email.log`

**Cần trợ giúp:**
- Technical: tech@soulfriend.com
- Emergency: +84-xxx-xxx-xxx

---

**Updated:** November 6, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

