# 🧪 Test Deployed Features

## Check deployment status (sau 5 phút)

### 1. Test Health Check

```bash
curl https://soulfriend-api.onrender.com/api/health
```

Expected:
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "chatbot": "ready"
}
```

---

### 2. Test HITL Feedback API

```bash
# Get metrics
curl https://soulfriend-api.onrender.com/api/hitl-feedback/metrics
```

---

### 3. Test Conversation Learning

```bash
# Get insights
curl https://soulfriend-api.onrender.com/api/conversation-learning/insights
```

---

### 4. Test trong Browser

Open admin dashboard:
```
https://your-domain.com/admin-dashboard-with-feedback.html
```

---

## ✅ Success Criteria

- [ ] Health check returns 200
- [ ] HITL endpoints accessible
- [ ] Conversation learning endpoints working
- [ ] MongoDB connected (check logs)
- [ ] No deployment errors

---

## 📊 Monitor

Check Render logs:
1. Login to https://dashboard.render.com
2. Select service: soulfriend-api
3. View logs tab
4. Should see:
   ```
   ✅ MongoDB connected successfully
   ✅ Database connected
   🚀 SoulFriend V4.0 Server Started!
   ```

---

## 🎯 Next Steps

1. Wait 5 minutes for deployment
2. Test endpoints
3. Chat với chatbot
4. Check MongoDB collections có data
5. Review metrics sau 1 ngày

**🎊 Chatbot tự học đã sẵn sàng!** 🚀

