# 📧 SendGrid Email Setup Guide

## ✅ Why SendGrid?

- **Reliable**: Works perfectly with Railway (no network blocking)
- **Free Tier**: 100 emails/day free forever
- **Fast**: API-based, no SMTP connection issues
- **Professional**: Better deliverability than Gmail SMTP

## 🚀 Quick Setup

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up for free account
3. Verify your email address

### Step 2: Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `SoulFriend HITL`
4. Permissions: **Full Access** (or **Mail Send** only)
5. Click **Create & View**
6. **COPY THE API KEY** (you can only see it once!)

### Step 3: Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email (e.g., `noreply@soulfriend.vn` or `le3221374@gmail.com`)
4. Verify the email address
5. This email will be used as the "from" address

### Step 4: Set API Key on Railway

**Option A: Railway Dashboard (Recommended)**

1. Go to https://railway.app
2. Select project **soulfriend**
3. Click service **backend**
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Key: `SENDGRID_API_KEY`
7. Value: `[paste your SendGrid API key]`
8. Click **Add**

**Option B: Railway CLI**

```powershell
railway variables --service soulfriend --set "SENDGRID_API_KEY=SG.your_api_key_here"
```

### Step 5: Verify Setup

After Railway redeploys, check logs:

```powershell
railway logs --service soulfriend --tail 50 | Select-String "Email service"
```

Should see:
- ✅ `Email service initialized with SendGrid API`

## 🧪 Test Email

Send a critical message to production API:

```powershell
$body = @{
    message = "Tôi muốn tự tử ngay bây giờ"
    sessionId = "test_sendgrid_$(Get-Date -Format 'HHmmss')"
    userId = "test_user"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "https://soulfriend-production.up.railway.app/api/v2/chatbot/message" `
    -Method POST -Body $body -ContentType "application/json; charset=utf-8"
```

Check logs for:
- ✅ `EMAIL SENT SUCCESSFULLY (SendGrid)`
- ✅ `statusCode: 202` or `statusCode: 200`
- ✅ `messageId: [some-id]`

Check your email inbox - you should receive the alert!

## 📊 SendGrid Dashboard

Monitor email sending:
- Go to **Activity** → **Email Activity**
- See all sent emails, delivery status, opens, clicks
- Free tier: 100 emails/day

## 🔄 Fallback to SMTP

If `SENDGRID_API_KEY` is not set, the system will automatically fallback to SMTP (if configured).

Priority:
1. **SendGrid** (if `SENDGRID_API_KEY` is set) ← **Recommended**
2. **SMTP** (if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are set)

## ❌ Troubleshooting

### "Email service not configured"
- Check `SENDGRID_API_KEY` is set on Railway
- Verify API key is correct (starts with `SG.`)

### "SendGrid returned status 403"
- API key doesn't have "Mail Send" permission
- Create new API key with correct permissions

### "SendGrid returned status 400"
- Sender email not verified
- Go to SendGrid → Settings → Sender Authentication → Verify sender

### Emails not received
- Check spam folder
- Verify sender email in SendGrid dashboard
- Check SendGrid Activity logs for delivery status

## 📝 Notes

- **Free Tier Limits**: 100 emails/day
- **API Key Security**: Never commit API keys to git
- **Sender Verification**: Must verify sender email before sending
- **Rate Limits**: SendGrid has rate limits, but 100/day is plenty for HITL alerts

