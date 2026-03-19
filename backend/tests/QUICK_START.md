# 🚀 Quick Start Guide - Testing Gamification API

## ⚡ Start Backend Server

```bash
cd backend
npm run dev
```

Wait for: `✅ Server running on http://localhost:5000`

---

## 🧪 Run Tests (Choose One)

### 📊 Option 1: Full Automated Tests (TypeScript)
Best for comprehensive verification
```bash
cd backend
npm test -- test-foundation-gamification.ts
```

**Expected Output:**
```
✅ Get gamification data (initial)
✅ Get achievements
✅ Get daily challenges
✅ Track activity
...
🎉 All tests passed!
📈 Success Rate: 100%
```

**Pros:** Full validation, readable output
**Cons:** Requires node modules, slightly slower

---

### 🪟 Option 2: PowerShell Script (Windows Only)
Quick testing on Windows
```powershell
cd backend\tests
.\test-gamification.ps1
```

**Expected Output:**
```
✅ Get gamification data (initial)
   - Current Streak: 0
   - Current Level: 1
   - Total XP: 0
...
🎉 All tests passed!
```

**Pros:** Fast, colorful output, built-in error handling
**Cons:** Windows only, requires PowerShell 5.0+

---

### 🐧 Option 3: Bash Script (Linux/macOS)
Quick testing on Unix systems
```bash
cd backend/tests
bash test-gamification.sh
```

**Expected Output:**
```
✅ Get gamification data (initial)
✅ Get achievements
✅ Get daily challenges
...
🎉 All tests passed!
```

**Pros:** Fast, works on Linux/macOS, minimal dependencies
**Cons:** Requires bash, needs jq for JSON parsing

---

### 🔧 Option 4: Manual cURL Commands
Individual endpoint testing
```bash
# Test 1: Get initial data
curl -X GET "http://localhost:5000/api/foundation/gamification?userId=test-user-123" \
  -H "Content-Type: application/json"

# Test 2: Award XP
curl -X POST "http://localhost:5000/api/foundation/gamification/xp" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","xpAmount":100}'
```

**Pros:** Maximum flexibility, no dependencies beyond curl
**Cons:** Manual, time-consuming, requires cURL installed

---

## ✅ Test Success Indicators

Look for these signs of success:

### ✨ Data Initialization
```json
{
  "currentLevel": 1,
  "totalXP": 0,
  "achievements": 12,
  "dailyChallenges": 3,
  "levelTier": "bronze"
}
```

### 📈 XP Progression
```json
{
  "xpAdded": 100,
  "totalXP": 100,
  "xpToNextLevel": 0,
  "leveledUp": true,  // ← Should be true when XP reaches threshold
  "currentLevel": 2
}
```

### 🎯 Challenge Completion
```json
{
  "completed": true,
  "rewarded": 50,
  "earned": "50 XP"
}
```

### 📊 Streak Tracking
```json
{
  "currentStreak": 1,
  "bestStreak": 1,
  "lastActiveDate": "2024-01-01T12:00:00Z"
}
```

---

## 🐛 Troubleshooting Quick Fixes

### ❌ "Connection Refused" Error
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Fix:** Backend server not running
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Run tests
cd backend/tests
.\test-gamification.ps1
```

---

### ❌ "Invalid JSON Response"
```
Error: Unexpected token < in JSON at position 0
```

**Fix:** Backend returned HTML error page instead of JSON
- Check server logs for errors
- Verify `foundation.ts` is correctly updated
- Restart server: `npm run dev`

---

### ❌ "404 Not Found"
```
Error: POST /api/foundation/gamification/xp 404
```

**Fix:** Endpoint not found in routes
- Verify `foundation.ts` has new imports and endpoints
- Verify no typos in endpoint paths
- Restart server after file changes

---

### ❌ "Timeout" Error
```
Error: Request timeout after 5000ms
```

**Fix:** Server responding slowly or MongoDB is slow
- Check MongoDB is running
- Increase timeout in test scripts
- Check server logs for slow queries

---

### ❌ "Duplicated XP" or "Wrong Totals"
```
Expected totalXP: 300, Got: 150
```

**Fix:** Previous test runs left data in database
- Use fresh userId for each test run (automatically done)
- Or clear test data:
```bash
# MongoDB CLI
db.englishfoundationgamifications.deleteMany({ userId: /test-user-/ })
```

---

## 📋 Test Checklist

After tests pass, verify:

- [ ] ✅ **Initial State**: User created with level 1, 0 XP
- [ ] ✅ **Achievements**: 12 achievements available (4 rarity tiers)
- [ ] ✅ **Challenges**: 3 daily challenges with correct rewards
- [ ] ✅ **Activity Tracking**: First activity creates streak
- [ ] ✅ **XP Progression**: 50 XP awarded, level stays 1
- [ ] ✅ **Level Up**: 200 XP awarded, level becomes 2
- [ ] ✅ **Challenge Progress**: Progress tracked 1/3 → 2/3 → 3/3
- [ ] ✅ **Challenge Reward**: 50 XP claimed when complete
- [ ] ✅ **Final State**: All data persisted and consistent

---

## 📊 Expected Test Output Summary

```
🧪 English Foundation Gamification API Tests
📝 Test User ID: test-user-1704096000123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Get gamification data (initial)
   - Current Streak: 0
   - Current Level: 1
   - Total XP: 0
   - Achievements: 0/12

✅ Get achievements
   - Achievements: 12

✅ Get daily challenges
   - Challenges: 3

✅ Track activity
   - Streak: 1
   - Level: 1
   - XP: 0
   - New Achievements: first_lesson

✅ Award 50 XP
   - XP Added: 50
   - Current Level: 1
   - Total XP: 50

✅ Award 200 XP (potential level up)
   - Current Level: 2
   - Total XP: 250
   ⬆️  LEVEL UP!

✅ Progress challenge step 1/3
   - Challenge: Complete 3 Lessons
   - Progress: 1/3

✅ Progress challenge step 2/3
   - Progress: 2/3

✅ Progress challenge step 3/3
   - Progress: 3/3
   ✅ Challenge Complete! Reward: 50 XP

✅ Claim challenge reward
   - Reward Claimed: 50 XP

✅ Get final gamification state
   - Streak: 1
   - Level: 2
   - Total XP: 300
   - Level Tier: BRONZE
   - Unlocked Achievements: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Passed: 10
📈 Success Rate: 100%

🎉 All tests passed!
```

---

## 🎯 Next Steps After Testing

1. **✅ Tests Passing?**
   - Continue to frontend integration
   - See `BACKEND_INTEGRATION_GUIDE.md` for API examples

2. **❌ Tests Failing?**
   - Check logs in `backend/` console
   - Run single test with cURL for debugging
   - Verify `foundation.ts` changes are saved

3. **🚀 Ready to Deploy?**
   - Tests passing ✅
   - All 7 endpoints working ✅
   - Performance acceptable ✅
   - Deploy to production

---

## 📚 Documentation

- **API Specifications**: See `BACKEND_INTEGRATION_GUIDE.md`
- **Detailed Test Plan**: See `TEST_PLAN.md`
- **Implementation Status**: See `PHASE_5_COMPLETION_REPORT.md`

---

## 💡 Tips

1. **Run tests in separate terminal**: Keep backend running in one, tests in another
2. **Use same userId for test sequence**: Ensures data accumulates correctly
3. **Check backend logs**: If test fails, server logs show why
4. **Fresh test runs**: Each test script creates unique userId
5. **Performance baseline**: First tests may be slower (db initialization)

---

## 🆘 Need Help?

Check these files in order:
1. `TEST_PLAN.md` - Detailed test documentation
2. `BACKEND_INTEGRATION_GUIDE.md` - API specs and examples
3. `backend/src/routes/foundation.ts` - Actual endpoint code
4. `backend/src/services/foundationGamificationService.ts` - Business logic

---

**Happy Testing! 🎉**
