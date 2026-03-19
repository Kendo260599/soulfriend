# English Foundation Gamification API - Test Plan & Manual Testing Guide

## Overview

This document provides comprehensive instructions for testing the English Foundation Gamification API endpoints. Three test methods are available:

1. **Automated TypeScript Tests** - `test-foundation-gamification.ts` (npm)
2. **PowerShell Script** - `test-gamification.ps1` (Windows)
3. **Bash Script** - `test-gamification.sh` (Linux/macOS)
4. **Manual cURL Commands** - For ad-hoc testing

## Prerequisites

Before running any tests:

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   # Should output: Server running on http://localhost:5000
   ```

2. **MongoDB Connection**
   - MongoDB must be running and accessible
   - Connection string configured in environment variables
   - Database should be initialized

3. **Test Dependencies** (for automated tests)
   ```bash
   npm install axios  # for TypeScript tests
   ```

---

## Test Scenarios

### Test 1: Initialize Gamification Data
**Endpoint:** `GET /gamification?userId={userId}`

**Purpose:** Create and retrieve initial gamification record for a user

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "test-user-123",
    "streak": {
      "currentStreak": 0,
      "bestStreak": 0,
      "missedDays": 0,
      "lastActiveDate": null
    },
    "xp": 0,
    "currentLevel": 1,
    "xpToNextLevel": 100,
    "totalXP": 0,
    "levelTier": "bronze",
    "achievements": [...], // 12 total
    "unlockedAchievementCount": 0,
    "dailyChallenges": [...], // 3 challenges
    "lastChallengeResetDate": "2024-01-01T00:00:00Z"
  }
}
```

**What It Verifies:**
- ✅ Initial gamification record creation
- ✅ Default values for new users
- ✅ Achievement list populated (12 items)
- ✅ Daily challenges initialized (3 items)
- ✅ Streak tracking initialized

**Key Values to Check:**
- All 12 achievements present
- All 3 daily challenges present
- Initial level = 1
- Initial XP = 0
- Level tier = "bronze"

---

### Test 2: Get Achievements Only
**Endpoint:** `GET /gamification/achievements?userId={userId}`

**Purpose:** Retrieve user's achievements/badges

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "first_lesson",
      "name": "First Lesson",
      "description": "Complete your first lesson",
      "icon": "🎓",
      "rarity": "common",
      "unlocked": false,
      "unlockedAt": null
    },
    // ... 11 more achievements
  ]
}
```

**What It Verifies:**
- ✅ All 12 achievements returned
- ✅ Achievement structure correct
- ✅ Unlock status tracking
- ✅ Rarity distribution (4 tiers: common, uncommon, rare, legendary)

**Key Values to Check:**
- Achievements array length = 12
- All have required fields: id, name, description, icon, rarity, unlocked, unlockedAt
- Rarity distribution: 3 common, 3 uncommon, 3 rare, 3 legendary

---

### Test 3: Get Daily Challenges Only
**Endpoint:** `GET /gamification/challenges?userId={userId}`

**Purpose:** Retrieve user's daily challenges/quests

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "daily_3_lessons",
      "title": "Complete 3 Lessons",
      "description": "Complete 3 English lessons",
      "icon": "📚",
      "target": 3,
      "current": 0,
      "reward": 50,
      "completed": false,
      "resetDate": "2024-01-02T00:00:00Z"
    },
    // ... 2 more challenges
  ]
}
```

**What It Verifies:**
- ✅ All 3 daily challenges present
- ✅ Challenge structure correct
- ✅ Progress tracking initialized at 0
- ✅ Reset date set to tomorrow UTC midnight
- ✅ Reward values assigned

**Key Values to Check:**
- Challenges array length = 3
- Challenge 1: "daily_3_lessons" - Complete 3 Lessons (50 XP)
- Challenge 2: "daily_10_min_grammar" - 10 Minutes Grammar (30 XP)
- Challenge 3: "daily_20_words" - Learn 20 Words (40 XP)
- Total daily rewards available = 120 XP

---

### Test 4: Track User Activity
**Endpoint:** `POST /gamification/activity`

**Request Body:**
```json
{
  "userId": "test-user-123",
  "activityType": "lesson_complete"
}
```

**Purpose:** Record user activity and update streak

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "test-user-123",
    "streak": {
      "currentStreak": 1,
      "lastActiveDate": "2024-01-01T12:00:00Z",
      "missedDays": 0
    },
    "level": 1,
    "xp": 0,
    "newAchievements": ["first_lesson"] // if applicable
  }
}
```

**What It Verifies:**
- ✅ Streak incremented on first activity
- ✅ Last activity date updated
- ✅ Missed days calculated correctly
- ✅ New achievements unlocked (if conditions met)
- ✅ Response includes all required fields

**Key Values to Check:**
- currentStreak incremented from 0 to 1
- lastActiveDate updated to today
- First activity unlocks "first_lesson" achievement

---

### Test 5: Award XP (Small Amount)
**Endpoint:** `POST /gamification/xp`

**Request Body:**
```json
{
  "userId": "test-user-123",
  "xpAmount": 50
}
```

**Purpose:** Award XP to user, check for level-ups

**Expected Response (No Level Up):**
```json
{
  "success": true,
  "data": {
    "xpAdded": 50,
    "currentXP": 50,
    "currentLevel": 1,
    "totalXP": 50,
    "xpToNextLevel": 50,
    "leveledUp": false,
    "newAchievements": []
  }
}
```

**What It Verifies:**
- ✅ XP awarded correctly
- ✅ Current XP within level tracked
- ✅ Total XP accumulated
- ✅ XP to next level calculated
- ✅ No premature level-up

**Key Values to Check:**
- currentXP = 50
- totalXP = 50 (from test 4: 0 + 50 = 50)
- xpToNextLevel = 50 (100 - 50)
- leveledUp = false
- currentLevel = 1

---

### Test 6: Award XP (Large Amount - Trigger Level Up)
**Endpoint:** `POST /gamification/xp`

**Request Body:**
```json
{
  "userId": "test-user-123",
  "xpAmount": 200
}
```

**Purpose:** Award enough XP to trigger level-up, verify level tier promotion

**Expected Response (With Level Up):**
```json
{
  "success": true,
  "data": {
    "xpAdded": 200,
    "currentXP": 50,
    "currentLevel": 2,
    "totalXP": 250,
    "xpToNextLevel": 50,
    "leveledUp": true,
    "newAchievements": ["five_lessons"] // if applicable
  }
}
```

**What It Verifies:**
- ✅ XP overflow to next level handled
- ✅ Level incremented
- ✅ Current XP reset for new level
- ✅ Level-up achievements unlocked
- ✅ `leveledUp` flag set to true

**Key Values to Check:**
- totalXP = 250 (50 + 200)
- currentLevel = 2 (after reaching 100 total XP)
- currentXP = 150 of 200 for next level (250 total, 100 for L1, 150 for L2)
- leveledUp = true
- xpToNextLevel = 50 (200 - 150)

---

### Test 7: Progress Daily Challenge (Step 1/3)
**Endpoint:** `POST /gamification/challenge/progress`

**Request Body:**
```json
{
  "userId": "test-user-123",
  "challengeId": "daily_3_lessons",
  "progress": 1
}
```

**Purpose:** Track progress toward daily challenge completion

**Expected Response (Not Complete):**
```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "daily_3_lessons",
      "title": "Complete 3 Lessons",
      "current": 1,
      "target": 3,
      "reward": 50,
      "completed": false
    },
    "completed": false
  }
}
```

**What It Verifies:**
- ✅ Challenge progress tracked
- ✅ Current progress incremented
- ✅ Challenge not marked complete yet
- ✅ Reward not awarded yet

**Key Values to Check:**
- challenge.current = 1
- challenge.target = 3
- completed = false

---

### Test 8: Complete Daily Challenge (Steps 2-3)
**Endpoint:** `POST /gamification/challenge/progress`

**Request Body (Loop 2 times with progress: 1)**
```json
{
  "userId": "test-user-123",
  "challengeId": "daily_3_lessons",
  "progress": 1
}
```

**Expected Response (On 3rd Progress - Auto-Complete):**
```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "daily_3_lessons",
      "title": "Complete 3 Lessons",
      "current": 3,
      "target": 3,
      "reward": 50,
      "completed": true
    },
    "completed": true,
    "message": "Challenge completed! Ready for reward claim."
  }
}
```

**What It Verifies:**
- ✅ Progress accumulates correctly (1 → 2 → 3)
- ✅ Auto-completion when current reaches target
- ✅ Challenge marked complete
- ✅ Reward ready for claiming (not auto-claimed)

**Key Values to Check:**
- challenge.current = 3 (after 3 progress increments)
- challenge.completed = true
- completed = true
- No XP awarded yet (pending manual claim)

---

### Test 9: Claim Challenge Reward
**Endpoint:** `POST /gamification/challenge/claim`

**Request Body:**
```json
{
  "userId": "test-user-123",
  "challengeId": "daily_3_lessons"
}
```

**Purpose:** Claim XP reward for completed daily challenge

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "daily_3_lessons",
      "completed": true,
      "claimed": true
    },
    "rewarded": 50,
    "newLevel": false,
    "newAchievements": []
  }
}
```

**What It Verifies:**
- ✅ Reward XP awarded on claim
- ✅ Challenge marked as claimed
- ✅ Duplicate claims prevented (idempotent)
- ✅ Achievement checks run after reward

**Key Values to Check:**
- rewarded = 50 (challenge reward)
- claimed = true
- Challenge can only be claimed once per day

---

### Test 10: Verify Final Gamification State
**Endpoint:** `GET /gamification?userId={userId}`

**Purpose:** Final verification of all accumulated changes

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "test-user-123",
    "streak": {
      "currentStreak": 1,
      "bestStreak": 1,
      "lastActiveDate": "2024-01-01T12:00:00Z"
    },
    "xp": 50,
    "currentLevel": 2,
    "totalXP": 300,
    "levelTier": "bronze",
    "achievements": [
      {
        "id": "first_lesson",
        "unlocked": true,
        "unlockedAt": "2024-01-01T12:00:00Z"
      },
      // ... remaining achievements
    ],
    "unlockedAchievementCount": 1,
    "dailyChallenges": [
      {
        "id": "daily_3_lessons",
        "completed": true,
        "claimed": true
      },
      // ... remaining challenges
    ]
  }
}
```

**What It Verifies:**
- ✅ All previous changes persisted
- ✅ Streak tracking correct
- ✅ Total experience accumulated (300 XP)
- ✅ Level advancement accurate (Level 2)
- ✅ Achievement unlocks recorded
- ✅ Challenge completion tracked
- ✅ Data consistency across operations

**Key Values to Check:**
- totalXP = 300 (50 from Test 5, 200 from Test 6, 50 from claim)
- currentLevel = 2
- streak.currentStreak = 1
- unlockedAchievementCount ≥ 1
- At least one challenge completed and claimed

---

## Running Automated Tests

### Option 1: TypeScript Tests (npm)
```bash
cd backend
npm install axios  # if not already installed
npm test -- test-foundation-gamification.ts
```

### Option 2: PowerShell Script (Windows)
```powershell
# Make sure to run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd backend\tests
.\test-gamification.ps1
```

### Option 3: Bash Script (Linux/macOS)
```bash
cd backend/tests
chmod +x test-gamification.sh
./test-gamification.sh
```

---

## Manual Testing with cURL

### Test 1: Get Initial Gamification
```bash
curl -X GET "http://localhost:5000/api/foundation/gamification?userId=test-user-123" \
  -H "Content-Type: application/json"
```

### Test 2: Get Achievements
```bash
curl -X GET "http://localhost:5000/api/foundation/gamification/achievements?userId=test-user-123" \
  -H "Content-Type: application/json"
```

### Test 3: Get Challenges
```bash
curl -X GET "http://localhost:5000/api/foundation/gamification/challenges?userId=test-user-123" \
  -H "Content-Type: application/json"
```

### Test 4: Track Activity
```bash
curl -X POST "http://localhost:5000/api/foundation/gamification/activity" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","activityType":"lesson_complete"}'
```

### Test 5: Award XP (50)
```bash
curl -X POST "http://localhost:5000/api/foundation/gamification/xp" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","xpAmount":50}'
```

### Test 6: Award XP (200)
```bash
curl -X POST "http://localhost:5000/api/foundation/gamification/xp" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","xpAmount":200}'
```

### Test 7: Progress Challenge
```bash
curl -X POST "http://localhost:5000/api/foundation/gamification/challenge/progress" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","challengeId":"daily_3_lessons","progress":1}'
```

### Test 8: Claim Reward
```bash
curl -X POST "http://localhost:5000/api/foundation/gamification/challenge/claim" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","challengeId":"daily_3_lessons"}'
```

---

## Test Success Criteria

### All Tests Pass When:
- ✅ **Initialization**: User record created with 12 achievements, 3 challenges, level 1
- ✅ **Achievements**: All 12 achievements returned with correct rarity distribution
- ✅ **Challenges**: 3 daily challenges available with correct targets and rewards
- ✅ **Activity**: Streak incremented, last activity date updated
- ✅ **XP Reward**: XP accumulates, level-ups trigger at correct thresholds
- ✅ **Level Up**: Level increases, tier updates (bronze → silver at L6, etc.)
- ✅ **Challenge Progress**: Progress tracked toward completion
- ✅ **Challenge Complete**: Auto-completes at target, reward claimed successfully
- ✅ **Final State**: All changes persisted and consistent

### HTTP Status Codes:
- **200 OK**: Successful operation
- **400 Bad Request**: Missing required fields or invalid input
- **404 Not Found**: User not found (should auto-create)
- **500 Server Error**: Database or internal error

---

## Troubleshooting

### Tests Timeout
**Problem:** Requests never complete
**Solution:**
- Verify backend is running: `npm run dev`
- Check MongoDB connection
- Increase timeout in test scripts

### 404 on Endpoints
**Problem:** Endpoints not found
**Solution:**
- Verify `foundation.ts` has new imports and routes added
- Check backend restart after file changes
- Verify base URL is correct

### Data Not Persisting
**Problem:** Data lost between tests
**Solution:**
- Check MongoDB is running and connected
- Verify database permissions
- Check for transaction/session issues

### Level Up Not Triggering
**Problem:** XP awarded but level doesn't increase
**Solution:**
- Verify XP amounts: L1-5 need 100 each, L6-15 need 200 each
- Check `getTotalXPRequiredForLevel()` calculation
- Verify totalXP is accumulating correctly

### Achievements Not Unlocking
**Problem:** Achievement conditions met but not unlocked
**Solution:**
- Check achievement unlock conditions in service
- Verify `checkAndUnlockAchievements()` is called
- Check MongoDB schema has achievements array

---

## Performance Metrics to Track

During testing, note these metrics:

1. **Response Time**: Should be < 200ms for GET requests
2. **XP Processing**: Calculations should complete in < 50ms
3. **Level-up Speed**: Level calculation with validation < 100ms
4. **Database Query**: MongoDB queries should respond < 100ms
5. **Concurrent Users**: System should handle 10+ simultaneous requests

---

## Test Data Cleanup

To clean up test data after testing:

```bash
# MongoDB CLI
use english_foundation_db
db.englishfoundationgamifications.deleteMany({ userId: /test-user-/ })
```

Or via application:
```bash
# Delete specific test user
curl -X DELETE "http://localhost:5000/api/foundation/gamification/test-user-123"
```

---

## Next Steps

After successful testing:

1. ✅ Deploy backend to production
2. ✅ Implement frontend API calls (code samples in BACKEND_INTEGRATION_GUIDE.md)
3. ✅ Run user acceptance testing
4. ✅ Monitor for real-world issues
5. ✅ Gather user feedback on gamification engagement

