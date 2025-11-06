# 📧 Giải thích SMTP Configuration

## SMTP là gì?

**SMTP** (Simple Mail Transfer Protocol) là giao thức để gửi email. Khi bạn gửi email, ứng dụng cần kết nối đến một **SMTP server** để gửi email đi.

## Các thông số SMTP

### 1. `SMTP_HOST` - Địa chỉ server SMTP
- **Là gì?** Địa chỉ server email (không phải email của bạn)
- **Ví dụ:** `smtp.gmail.com` (server của Gmail)
- **Giải thích:** Đây là địa chỉ máy chủ email của Gmail, nơi bạn sẽ gửi email đến để Gmail gửi đi
- **KHÔNG PHẢI** là email address của bạn!

### 2. `SMTP_USER` - Email đăng nhập
- **Là gì?** Email address của bạn (tài khoản Gmail)
- **Ví dụ:** `le3221374@gmail.com` (email của bạn)
- **Giải thích:** Đây là email mà bạn sẽ dùng để đăng nhập và gửi email

### 3. `SMTP_PASS` - Mật khẩu
- **Là gì?** App Password (không phải mật khẩu Gmail thường)
- **Giải thích:** Mật khẩu đặc biệt để ứng dụng có thể gửi email thay bạn
- **Lưu ý:** Phải là App Password (16 ký tự), không phải mật khẩu Gmail thường

### 4. `SMTP_PORT` - Cổng kết nối
- **Là gì?** Cổng mạng để kết nối đến SMTP server
- **Ví dụ:** `587` (cho Gmail)
- **Giải thích:** Giống như cửa vào của một tòa nhà, mỗi dịch vụ có cổng riêng

## Ví dụ cụ thể

Giống như bạn gửi thư qua bưu điện:
- **SMTP_HOST** (`smtp.gmail.com`) = Địa chỉ bưu điện (Gmail)
- **SMTP_USER** (`le3221374@gmail.com`) = Tên người gửi (bạn)
- **SMTP_PASS** = Mật khẩu để xác nhận bạn là chủ thư
- **SMTP_PORT** (`587`) = Cửa vào bưu điện

## Cấu hình cho Gmail

```bash
SMTP_HOST=smtp.gmail.com          # Server của Gmail (KHÔNG THAY ĐỔI)
SMTP_PORT=587                      # Cổng của Gmail (KHÔNG THAY ĐỔI)
SMTP_USER=le3221374@gmail.com      # Email của bạn (THAY ĐỔI)
SMTP_PASS=your_app_password        # App Password của bạn (THAY ĐỔI)
```

## Các nhà cung cấp email khác

### Outlook/Office365:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
```

### Yahoo:
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your_email@yahoo.com
```

### SendGrid (Email service):
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

## Tóm tắt

| Biến | Là gì? | Ví dụ | Có thay đổi? |
|------|--------|-------|--------------|
| `SMTP_HOST` | Địa chỉ server email | `smtp.gmail.com` | ❌ Không (cố định cho Gmail) |
| `SMTP_PORT` | Cổng mạng | `587` | ❌ Không (cố định cho Gmail) |
| `SMTP_USER` | Email của bạn | `le3221374@gmail.com` | ✅ Có (email của bạn) |
| `SMTP_PASS` | App Password | `abcdefghijklmnop` | ✅ Có (App Password của bạn) |

## ✅ Đã cập nhật

Tôi đã cập nhật `SMTP_USER` thành `le3221374@gmail.com` trên Railway.

Bây giờ bạn chỉ cần set `SMTP_PASS` (App Password của `le3221374@gmail.com`) là xong!





