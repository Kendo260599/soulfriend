# 🔐 Hướng dẫn Rotate API Keys - SoulFriend

## ⚠️ QUAN TRỌNG
Tất cả API keys dưới đây đã bị **LỘ trong git history** và **PHẢI được rotate NGAY LẬP TỨC**.
Dù đã xóa khỏi source code, keys vẫn tồn tại trong git history.

---

## 📋 Danh sách keys cần rotate

### 1. 🔑 Gemini API Keys (Google Cloud)
**Số lượng lộ:** 4 keys khác nhau  
**Nền tảng:** Google Cloud Console  

**Cách rotate:**
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Chọn project chứa Gemini API
3. Xóa tất cả API keys hiện tại
4. Tạo API key mới → Copy key mới
5. Cập nhật trên Render: Dashboard → Service → Environment → `GEMINI_API_KEY`
6. Cập nhật `backend/.env` local: `GEMINI_API_KEY=key-moi`

### 2. 🔑 JWT Secret
**Mức độ:** CRITICAL  
**Nền tảng:** Tự generate  

**Cách rotate:**
```powershell
# Generate JWT secret mới (128 ký tự)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
1. Copy output → Cập nhật trên Render: `JWT_SECRET=secret-moi`
2. Cập nhật `backend/.env` local
3. **Lưu ý:** Tất cả sessions hiện tại sẽ bị invalid → admin/expert phải login lại

### 3. 🔑 Redis Password (Upstash)
**Nền tảng:** Upstash Console  

**Cách rotate:**
1. Truy cập [Upstash Console](https://console.upstash.com/)
2. Chọn Redis database
3. Reset password trong tab **Details**
4. Copy password mới + Redis URL mới
5. Cập nhật trên Render:
   - `REDIS_URL=redis://default:password-moi@host:port`
   - `REDIS_PASSWORD=password-moi`
6. Cập nhật `backend/.env` local

### 4. 🔑 Pinecone API Key
**Nền tảng:** Pinecone Console  

**Cách rotate:**
1. Truy cập [Pinecone Console](https://app.pinecone.io/)
2. Vào API Keys → Delete key cũ → Create new key
3. Cập nhật trên Render: `PINECONE_API_KEY=key-moi`
4. Cập nhật `backend/.env` local

### 5. 🔑 SendGrid API Key
**Nền tảng:** SendGrid Dashboard  

**Cách rotate:**
1. Truy cập [SendGrid](https://app.sendgrid.com/settings/api_keys)
2. Delete API key cũ
3. Create new API key (Full Access hoặc Restricted: Mail Send)
4. Cập nhật trên Render: `SENDGRID_API_KEY=SG.key-moi`
5. Cập nhật `backend/.env` local

### 6. 🔑 Sentry DSN
**Mức độ:** Low (DSN không phải secret nhạy cảm, nhưng nên rotate)  

**Cách rotate:**
1. Truy cập [Sentry](https://sentry.io/) → Project Settings → Client Keys
2. Rotate hoặc tạo DSN mới
3. Cập nhật trên Render: `SENTRY_DSN=dsn-moi`
4. Cập nhật Vercel: `REACT_APP_SENTRY_DSN=dsn-moi`

### 7. 🔑 Cerebras API Key (ĐÃ DEPRECATED)
**Hành động:** Không cần rotate — chỉ cần revoke key cũ  
1. Truy cập Cerebras dashboard → API Keys → Delete key cũ đã bị lộ

### 8. 🔑 Unknown Key `sk-or-v1-...`
**Hành động:** Xác định nguồn gốc key này và revoke  
Có thể là OpenRouter API key. Truy cập [OpenRouter](https://openrouter.ai/keys) để kiểm tra.

---

## 🧹 Scrub Git History

**QUAN TRỌNG:** Dù đã xóa files, secrets vẫn tồn tại trong git history!

### Cách 1: BFG Repo-Cleaner (Khuyến nghị)
```bash
# Cài đặt BFG
# Download từ: https://rtyley.github.io/bfg-repo-cleaner/

# Tạo file chứa các secrets cần xóa
# Tạo file passwords.txt với mỗi secret trên 1 dòng

# Chạy BFG
java -jar bfg.jar --replace-text passwords.txt .

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force --all
```

### Cách 2: git filter-repo
```bash
# Cài đặt
pip install git-filter-repo

# Thay thế secret trong toàn bộ history
git filter-repo --replace-text <(echo '***REDACTED_GEMINI_KEY***==>***REDACTED***')

# Force push
git push --force --all
```

### Cách 3: Tạo repo mới (Đơn giản nhất)
```bash
# Nếu không cần giữ git history
rm -rf .git
git init
git add .
git commit -m "Fresh start - all secrets rotated"
git remote add origin <your-repo-url>
git push -u origin main --force
```

---

## ✅ Checklist sau khi rotate

- [ ] Gemini API key đã rotate trên Google Cloud
- [ ] JWT Secret đã generate mới
- [ ] Redis password đã reset trên Upstash
- [ ] Pinecone API key đã rotate
- [ ] SendGrid API key đã rotate
- [ ] Sentry DSN đã rotate (tùy chọn)
- [ ] Cerebras key đã revoke
- [ ] Unknown `sk-or-v1` key đã revoke
- [ ] Tất cả keys mới đã cập nhật trên Render
- [ ] Tất cả keys mới đã cập nhật trong `backend/.env` local
- [ ] Git history đã được scrub
- [ ] App hoạt động bình thường sau rotate
- [ ] Admin có thể login
- [ ] Expert có thể login
- [ ] Chatbot hoạt động (Gemini API)
- [ ] Email gửi được (SendGrid)

---

## 📊 Tóm tắt công việc đã thực hiện

### Files đã xóa (chứa secrets):
- 11 JS test files (test-cerebras-*, test-gemini-*, analyze-api-key, check-redis-data, etc.)
- 23 deploy/railway PS1/SH scripts
- 60+ MD documentation files chứa API keys
- 2 thư mục coverage/ (frontend + backend)

### Code đã sửa:
- `backend/src/middleware/auth.ts` — Removed JWT fallback `'***REDACTED_JWT***'`
- `backend/src/routes/admin.ts` — Removed JWT fallback `'***REDACTED_JWT***'`
- `backend/src/routes/expertAuth.ts` — Removed JWT fallback, require env var or exit
- `backend/.env.production.template` — Removed hardcoded Gemini key
- `.gitignore` — Added 25+ patterns to prevent future secret commits
