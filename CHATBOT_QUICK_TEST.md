# 🧪 CHATBOT QUICK TEST GUIDE

## Cách test nhanh chatbot sau khi nâng cấp

### 🚀 Bước 1: Khởi động ứng dụng

```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend  
cd frontend
npm start
```

Ứng dụng sẽ mở tại: `http://localhost:3000`

---

### ✅ Bước 2: Test các tính năng mới

#### 1. **Test Chatbot UI**
- [ ] Click vào icon 🤖 ở góc dưới bên phải
- [ ] Chatbot sẽ mở và hiển thị welcome message
- [ ] Kiểm tra header: "CHUN - AI Companion"
- [ ] Kiểm tra status: "Luôn sẵn sàng lắng nghe bạn 💙"

#### 2. **Test Basic Chat**
- [ ] Gửi tin nhắn: "Xin chào"
- [ ] CHUN sẽ phản hồi bằng tiếng Việt
- [ ] Kiểm tra tin nhắn được format đẹp (markdown)
- [ ] Console log: `🤖 Using Google Gemini AI...`

#### 3. **Test Quick Actions**
- [ ] Click "Phân tích kết quả chi tiết 📊"
- [ ] Tin nhắn được tự động điền vào input
- [ ] Gửi và nhận phản hồi

#### 4. **Test Feedback System** 👍👎
- [ ] Sau mỗi tin nhắn bot, xuất hiện 2 nút feedback
- [ ] Click 👍 - nút sáng lên
- [ ] Click lại 👍 - nút tắt (toggle)
- [ ] Click 👎 - nút sáng lên
- [ ] Console log: `Feedback for message xxx: positive/negative`

#### 5. **Test Export Conversation** 📥
- [ ] Gửi vài tin nhắn để có lịch sử
- [ ] Click nút "📥 Xuất"
- [ ] File .txt sẽ download
- [ ] Mở file và kiểm tra format:
  ```
  [03/10/2025, 14:30:25] Bạn: Xin chào
  [03/10/2025, 14:30:28] CHUN: Xin chào! Mình là CHUN...
  ```

#### 6. **Test LocalStorage Persistence** 💾
- [ ] Gửi vài tin nhắn
- [ ] Refresh trang (F5)
- [ ] Mở lại chatbot
- [ ] ✅ Lịch sử chat vẫn còn

#### 7. **Test Clear History** 🗑️
- [ ] Click nút "🗑️ Xóa"
- [ ] Popup xác nhận xuất hiện
- [ ] Click "OK"
- [ ] Lịch sử bị xóa sạch
- [ ] LocalStorage cũng bị clear

#### 8. **Test Error & Retry** 🔄
**Cách tạo lỗi giả:**
- Tắt internet
- Gửi tin nhắn
- Lỗi xuất hiện: "Xin lỗi, tôi đang gặp vấn đề kỹ thuật..."
- Nút "🔄 Thử lại" xuất hiện trong toolbar
- Bật lại internet
- Click "🔄 Thử lại"
- ✅ Tin nhắn được gửi lại thành công

#### 9. **Test Crisis Detection** 🚨
- [ ] Gửi: "Tôi muốn tự tử"
- [ ] ✅ CHUN phát hiện crisis
- [ ] ✅ Hiển thị cảnh báo nghiêm trọng
- [ ] ✅ Hiển thị hotline: 1900 599 958

#### 10. **Test Mobile Responsive** 📱
- [ ] Mở DevTools (F12)
- [ ] Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Chọn iPhone/Android
- [ ] ✅ Chatbot full-screen
- [ ] ✅ Buttons có kích thước phù hợp
- [ ] ✅ Font size nhỏ hơn
- [ ] ✅ Padding tối ưu

#### 11. **Test Markdown Rendering** 📝
Gửi tin nhắn yêu cầu:
```
"Cho tôi 3 lời khuyên để giảm stress"
```

CHUN sẽ trả lời với markdown:
```markdown
**Lời khuyên giảm stress:**

1. Thực hành thiền chánh niệm
2. Tập thể dục nhẹ nhàng  
3. Dành thời gian cho sở thích

*Hãy nhớ: Bạn không cô đơn!* 💙
```

✅ Kiểm tra: Bold, lists, italic render đúng

---

### 🔍 Kiểm tra Console Logs

Mở Console (F12 > Console) và kiểm tra:

```javascript
// Khi gửi tin nhắn
🤖 Using Google Gemini AI...
📤 Sending to Gemini: [user message]
📥 Gemini response: {...}

// Khi feedback
Feedback for message 1234567890: positive

// Khi save localStorage
// (Không có log, kiểm tra bằng Application tab)
```

---

### 📊 Kiểm tra LocalStorage

1. Mở DevTools (F12)
2. Tab "Application"
3. Left menu: "Local Storage" > `http://localhost:3000`
4. Tìm key: `chatbot_history`
5. Value: Array of messages trong JSON format

```json
[
  {
    "id": "1234567890",
    "text": "Xin chào",
    "isBot": false,
    "timestamp": "2025-10-03T...",
    "retryCount": 0
  },
  {
    "id": "1234567891", 
    "text": "Xin chào! Mình là CHUN...",
    "isBot": true,
    "timestamp": "2025-10-03T...",
    "feedback": "positive"
  }
]
```

---

### ⚡ Performance Check

#### Network Tab
- Gemini API call: ~2-3 seconds
- No unnecessary requests
- Error handling works

#### Render Performance
- Messages appear smoothly
- No lag when scrolling
- Typing indicator works
- Animations smooth

---

### 🐛 Common Issues & Solutions

#### Issue 1: "react-markdown not found"
```bash
cd frontend
npm install react-markdown
npm start
```

#### Issue 2: Gemini API error
- Check API key in `geminiService.ts`
- Check internet connection
- Check console for specific error

#### Issue 3: LocalStorage not working
- Check browser privacy settings
- Check if localStorage is enabled
- Try incognito mode

#### Issue 4: Messages not formatted
- Make sure react-markdown is imported
- Check if ReactMarkdown component is used
- Inspect element to see rendered HTML

---

### ✅ Success Criteria

**Tất cả tests pass nếu:**
- [x] Chatbot mở/đóng bình thường
- [x] Gemini AI phản hồi đúng
- [x] Markdown render đẹp
- [x] Feedback buttons hoạt động
- [x] Export file .txt thành công
- [x] LocalStorage lưu/load đúng
- [x] Clear history hoạt động
- [x] Retry logic hoạt động
- [x] Mobile responsive tốt
- [x] Crisis detection hoạt động
- [x] Không có console errors

---

### 📸 Screenshots

**Nên chụp screenshots cho:**
1. Welcome message
2. Chat conversation với markdown
3. Feedback buttons (active state)
4. Toolbar với 3 buttons
5. Export file content
6. Mobile view
7. Crisis alert

---

### 🎯 Quick Test (5 phút)

Nếu không có thời gian test đầy đủ:

1. ✅ Mở chatbot
2. ✅ Gửi: "Xin chào"
3. ✅ Nhận phản hồi
4. ✅ Click 👍
5. ✅ Click "📥 Xuất"
6. ✅ Refresh trang, lịch sử vẫn còn

**Pass = OK to deploy! 🚀**

---

**Test Date**: 2025-10-03  
**Tester**: [Your Name]  
**Result**: ✅ PASS / ❌ FAIL  
**Notes**: ___________

