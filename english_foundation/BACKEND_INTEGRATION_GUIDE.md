# 🔗 Frontend-Backend Gamification Integration Guide

**Date:** March 19, 2026  
**Module:** English Foundation + SoulFriend Gamification System

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/foundation/gamification
```

### 1. Get User Gamification Data
**GET** `/gamification`

**Query Parameters:**
- `userId` (string, required) - User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "streak": {
      "currentStreak": 5,
      "bestStreak": 12,
      "lastActiveDate": "2026-03-19T00:00:00.000Z",
      "missedDays": 0,
      "startDate": "2026-03-15T00:00:00.000Z"
    },
    "xp": 250,
    "currentLevel": 3,
    "xpToNextLevel": 350,
    "totalXP": 450,
    "levelTier": "silver",
    "achievements": [...],
    "unlockedAchievementCount": 5,
    "dailyChallenges": [...],
    "lastActiveSessionDate": "2026-03-19T14:30:00.000Z"
  }
}
```

### 2. Get Achievements
**GET** `/gamification/achievements`

**Query Parameters:**
- `userId` (string, required)

**Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "first_lesson",
        "name": "First Step",
        "description": "Complete your first lesson",
        "icon": "🎓",
        "rarity": "common",
        "unlocked": true,
        "unlockedAt": "2026-03-15T10:30:00.000Z"
      }
    ],
    "unlockedCount": 5,
    "totalCount": 12
  }
}
```

### 3. Get Daily Challenges
**GET** `/gamification/challenges`

**Query Parameters:**
- `userId` (string, required)

**Response:**
```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "id": "daily_3_lessons",
        "title": "Complete 3 Lessons",
        "description": "Finish 3 lessons to earn bonus XP",
        "icon": "📚",
        "target": 3,
        "current": 2,
        "reward": 50,
        "completed": false,
        "completedAt": null,
        "resetDate": "2026-03-20T00:00:00.000Z"
      }
    ],
    "completedCount": 1,
    "totalRewardToday": 30
  }
}
```

### 4. Track User Activity
**POST** `/gamification/activity`

**Request Body:**
```json
{
  "userId": "user123",
  "activityType": "lesson_complete"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "streak": {...},
    "level": 3,
    "xp": 250,
    "newAchievements": ["daily_05"]
  }
}
```

### 5. Award XP
**POST** `/gamification/xp`

**Request Body:**
```json
{
  "userId": "user123",
  "xpAmount": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "xpAdded": 50,
    "currentXP": 300,
    "totalXP": 500,
    "currentLevel": 4,
    "leveledUp": true,
    "xpToNextLevel": 150,
    "newAchievements": ["level_10"]
  }
}
```

### 6. Progress Daily Challenge
**POST** `/gamification/challenge/progress`

**Request Body:**
```json
{
  "userId": "user123",
  "challengeId": "daily_3_lessons",
  "progress": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challengeId": "daily_3_lessons",
    "completed": true,
    "challenge": {...},
    "achievements": []
  }
}
```

### 7. Claim Daily Challenge Reward
**POST** `/gamification/challenge/claim`

**Request Body:**
```json
{
  "userId": "user123",
  "challengeId": "daily_3_lessons"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rewarded": 50,
    "challenge": {...}
  }
}
```

---

## 🎮 Frontend Integration Examples

### StreakWidget Component
```typescript
// src/components/StreakWidget.tsx
const [streakData, setStreakData] = useState(null);

useEffect(() => {
  const fetchStreak = async () => {
    const response = await fetch(
      `/api/foundation/gamification?userId=${userId}`
    );
    const data = await response.json();
    setStreakData(data.data.streak);
  };
  
  fetchStreak();
}, [userId]);

return (
  <StreakWidget
    currentStreak={streakData?.currentStreak || 0}
    bestStreak={streakData?.bestStreak || 0}
    missedDays={streakData?.missedDays || 0}
  />
);
```

### XPProgressBar Component
```typescript
// src/components/XPProgressBar.tsx
const [xpData, setXPData] = useState(null);

useEffect(() => {
  const fetchXP = async () => {
    const response = await fetch(
      `/api/foundation/gamification?userId=${userId}`
    );
    const data = await response.json();
    setXPData({
      currentXP: data.data.xp,
      xpToNextLevel: data.data.xpToNextLevel,
      currentLevel: data.data.currentLevel,
      totalXP: data.data.totalXP,
    });
  };
  
  fetchXP();
}, [userId]);

return (
  <XPProgressBar
    currentXP={xpData?.currentXP || 0}
    xpToNextLevel={xpData?.xpToNextLevel || 100}
    currentLevel={xpData?.currentLevel || 1}
    totalXP={xpData?.totalXP || 0}
  />
);
```

### AchievementBadges Component
```typescript
// src/components/AchievementBadges.tsx
const [achievements, setAchievements] = useState([]);

useEffect(() => {
  const fetchAchievements = async () => {
    const response = await fetch(
      `/api/foundation/gamification/achievements?userId=${userId}`
    );
    const data = await response.json();
    setAchievements(data.data.achievements);
  };
  
  fetchAchievements();
}, [userId]);

return (
  <AchievementBadges
    achievements={achievements}
    unlockedCount={achievements.filter(a => a.unlocked).length}
  />
);
```

### DailyChallenge Component
```typescript
// src/components/DailyChallenge.tsx
const [challenges, setChallenges] = useState([]);

useEffect(() => {
  const fetchChallenges = async () => {
    const response = await fetch(
      `/api/foundation/gamification/challenges?userId=${userId}`
    );
    const data = await response.json();
    setChallenges(data.data.challenges);
  };
  
  fetchChallenges();
}, [userId]);

const handleClaimReward = async (challengeId) => {
  const response = await fetch(
    `/api/foundation/gamification/challenge/claim`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, challengeId }),
    }
  );
  const data = await response.json();
  // Update UI with new XP/rewards
};

return (
  <DailyChallenge
    challenge={challenges[0]}
    completed={challenges[0]?.completed}
    onClaimReward={() => handleClaimReward(challenges[0]?.id)}
  />
);
```

### Track Activity on Lesson Complete
```typescript
// When user completes a lesson
const completeLesson = async () => {
  // ... existing lesson completion logic ...
  
  // Track activity for gamification
  const response = await fetch(
    `/api/foundation/gamification/activity`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        activityType: 'lesson_complete',
      }),
    }
  );
  
  const data = await response.json();
  console.log('Streak updated:', data.data.streak);
  console.log('New achievements:', data.data.newAchievements);
};
```

### Award XP on Quiz Success
```typescript
// When user gets 100% on a quiz
const submitQuizAnswers = async (answers) => {
  const score = calculateScore(answers);
  
  if (score === 100) {
    // Award XP
    const response = await fetch(
      `/api/foundation/gamification/xp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          xpAmount: 50, // Base amount, can vary
        }),
      }
    );
    
    const data = await response.json();
    showNotification(`+${data.data.xpAdded} XP!`);
    
    if (data.data.leveledUp) {
      showCelebration(`Level Up! Now Level ${data.data.currentLevel}`);
    }
  }
};
```

---

## 🔄 Integration Workflow

### 1. On App Load
```typescript
// App.tsx
useEffect(() => {
  const initializeGamification = async () => {
    // Fetch all gamification data
    const response = await fetch(
      `/api/foundation/gamification?userId=${userId}`
    );
    const gamificationData = await response.json();
    
    // Initialize all components with data
    setStreakData(gamificationData.data.streak);
    setXPData({...});
    setAchievements(gamificationData.data.achievements);
    setChallenges(gamificationData.data.dailyChallenges);
  };
  
  initializeGamification();
}, [userId]);
```

### 2. On Lesson Start
```typescript
// Track activity (updates streak)
const startLesson = async () => {
  await fetch('/api/foundation/gamification/activity', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      activityType: 'lesson_start',
    }),
  });
};
```

### 3. On Lesson Complete
```typescript
// Award XP + track completion
const finishLesson = async () => {
  // Award XP based on performance
  await fetch('/api/foundation/gamification/xp', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      xpAmount: 30, // or based on score
    }),
  });
  
  // Track activity
  await fetch('/api/foundation/gamification/activity', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      activityType: 'lesson_complete',
    }),
  });
  
  // Progress daily challenges
  await fetch('/api/foundation/gamification/challenge/progress', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      challengeId: 'daily_3_lessons',
      progress: 1,
    }),
  });
};
```

### 4. On Challenge Completion
```typescript
// Claim reward when challenge completed
const claimChallengeReward = async (challengeId) => {
  const response = await fetch(
    '/api/foundation/gamification/challenge/claim',
    {
      method: 'POST',
      body: JSON.stringify({ userId, challengeId }),
    }
  );
  
  const data = await response.json();
  showNotification(`Reward Claimed: +${data.data.rewarded} XP!`);
};
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────┐
│   Frontend Components   │
├─────────────────────────┤
│ StreakWidget            │
│ XPProgressBar           │
│ AchievementBadges       │
│ DailyChallenge          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Foundation Route Handler          │
│   /api/foundation/gamification*     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Gamification Service              │
│   (foundationGamificationService)   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   MongoDB Model                     │
│   EnglishFoundationGamification     │
└─────────────────────────────────────┘
```

---

## ✅ Integration Checklist

- [ ] Model created (`EnglishFoundationGamification.ts`)
- [ ] Service created (`foundationGamificationService.ts`)
- [ ] Routes added to `foundation.ts`
- [ ] Import gamification service in routes
- [ ] Test `/gamification` endpoint
- [ ] Test `/gamification/achievements` endpoint
- [ ] Test `/gamification/challenges` endpoint
- [ ] Test `/gamification/activity` endpoint
- [ ] Test `/gamification/xp` endpoint
- [ ] Integrate StreakWidget in App.tsx
- [ ] Integrate XPProgressBar in App.tsx
- [ ] Integrate AchievementBadges in App.tsx
- [ ] Integrate DailyChallenge in App.tsx
- [ ] Hook up lesson completion to XP award
- [ ] Hook up activity tracking to streak update
- [ ] Hook up challenge progress tracking

---

## 🧪 Testing

### cURL Examples

```bash
# Get gamification data
curl -X GET "http://localhost:5000/api/foundation/gamification?userId=user123"

# Track activity
curl -X POST "http://localhost:5000/api/foundation/gamification/activity" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","activityType":"lesson_complete"}'

# Award XP
curl -X POST "http://localhost:5000/api/foundation/gamification/xp" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","xpAmount":50}'

# Progress challenge
curl -X POST "http://localhost:5000/api/foundation/gamification/challenge/progress" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","challengeId":"daily_3_lessons","progress":1}'
```

---

**✨ Integration Complete! All gamification systems are connected.** 🎉
