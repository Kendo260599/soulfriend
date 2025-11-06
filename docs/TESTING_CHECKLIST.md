# 🧪 Testing Checklist Before Push

## ✅ Pre-Push Testing Checklist

Trước khi push code lên GitHub, **LUÔN** chạy các tests sau:

### 1. **Build Check**
```bash
cd backend
npm run build
```
- ✅ **PASS**: Compiled code generated without errors
- ❌ **FAIL**: Fix TypeScript errors before pushing

### 2. **Lint Check**
```bash
cd backend
npm run lint
```
- ✅ **PASS**: No linting errors
- ❌ **FAIL**: Run `npm run lint:fix` or fix manually

### 3. **Type Check**
```bash
cd backend
npm run type-check
```
- ✅ **PASS**: No type errors
- ❌ **FAIL**: Fix TypeScript type errors

### 4. **Server Startup Test**
```bash
node backend/test-server-startup.js
```
- ✅ **PASS**: Server can start and bind to port
- ❌ **FAIL**: Fix server startup issues

### 5. **Import Test**
```bash
node -e "require('./backend/dist/index.js')"
```
- ✅ **PASS**: Server module can be imported
- ❌ **FAIL**: Fix module import errors

---

## 🚨 CRITICAL: Never Push Without Testing

**Luôn chạy ít nhất tests 1-3 trước khi push!**

---

## 📝 Quick Test Command

```bash
# Run all tests at once
cd backend && npm run build && npm run lint && npm run type-check && node ../test-server-startup.js
```

---

## 🔧 Automated Pre-Push Hook (Optional)

Có thể setup Git pre-push hook để tự động test trước khi push:

```bash
# Create .git/hooks/pre-push
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
cd backend
npm run build && npm run lint && npm run type-check
EOF
chmod +x .git/hooks/pre-push
```

---

**Lưu ý**: Tôi sẽ **LUÔN** chạy các tests này trước khi push từ bây giờ!










