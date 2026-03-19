# English Foundation Module - Implementation Action Plan
**Date:** March 19, 2026  
**Version:** 1.0

---

## 🎯 Immediate Actions (This Week)

### ACTION 1: Fix Answer Submission (CRITICAL)
**Location:** `frontend/src/screens/LessonScreen.tsx`  
**Current Problem:** Users see flashcards but responses don't save  
**Solution:**

1. Add state for user answers:
```tsx
const [answers, setAnswers] = useState<Array<{wordId: number; correct: boolean}>>([]);
const [submitted, setSubmitted] = useState(false);
```

2. Add methods to handle user responses:
```tsx
const handleMarkCorrect = () => {
  const currentCard = cards[index];
  const wordId = extractWordId(currentCard.key);
  setAnswers([...answers, {wordId, correct: true}]);
  handleNext();
};

const handleMarkSkip = () => {
  // Treat as "not sure" - mark as wrong for this pass
  const currentCard = cards[index];
  const wordId = extractWordId(currentCard.key);
  setAnswers([...answers, {wordId, correct: false}]);
  handleNext();
};
```

3. On lesson finish, submit results:
```tsx
const handleFinish = async () => {
  try {
    const result = await submitVocabCheck(1, lesson.lesson_meta?.id, answers);
    console.log('Lesson result:', result);
    onFinish(); // Go back to home
  } catch (e) {
    setError(e?.message);
  }
};
```

4. Update UI buttons:
```tsx
<button onClick={handleMarkCorrect}>✓ I know this</button>
<button onClick={handleMarkSkip}>? Not sure</button>
<button onClick={handleNext}>Skip</button>
```

**Effort:** 1.5 hours  
**Testing:** Manual UI testing + verify submission via browser F12

### ACTION 2: Implement Missing learningApi Methods (CRITICAL)
**Location:** `frontend/src/services/learningApi.ts`  
**Current:** Only fetchLesson() and fetchProgress() exist  
**Required additions:**

```typescript
export async function submitVocabCheck(
  learnerId: number,
  lessonId: string,
  answers: Array<{ wordId: number; correct: boolean }>
): Promise<{ score: number; correct: number; total: number; weak_items: number[] }> {
  const response = await fetch(`${API_BASE}/vocab-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, lessonId, answers }),
  });
  if (!response.ok) throw new Error('Failed to submit vocab check');
  return response.json();
}

export async function submitGrammarCheck(
  learnerId: number,
  lessonId: string,
  grammarId: number,
  correct: boolean
): Promise<{ grammar_level_after: number; grammar_level_percent: number }> {
  const response = await fetch(`${API_BASE}/grammar-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, lessonId, grammarId, correct }),
  });
  if (!response.ok) throw new Error('Failed to submit grammar check');
  return response.json();
}

export async function fetchCurriculum(): Promise<CurriculumPayload> {
  const response = await fetch(`${API_BASE}/curriculum`);
  if (!response.ok) throw new Error('Failed to load curriculum');
  return response.json();
}

export async function fetchTrackLesson(
  track: 'vocab' | 'grammar',
  lessonId: string,
  learnerId: number = 1
): Promise<TrackLessonPayload> {
  const response = await fetch(
    `${API_BASE}/lesson?track=${track}&lessonId=${lessonId}&learnerId=${learnerId}`
  );
  if (!response.ok) throw new Error('Failed to load track lesson');
  return response.json();
}

export async function fetchReview(
  learnerId: number = 1,
  limit: number = 20
): Promise<ReviewPayload> {
  const response = await fetch(
    `${API_BASE}/review?learnerId=${learnerId}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to load review items');
  return response.json();
}

export async function submitReview(
  learnerId: number,
  answers: Array<{ wordId: number; correct: boolean }>
): Promise<{ score: number; correct: number; total: number }> {
  const response = await fetch(`${API_BASE}/review-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnerId, answers }),
  });
  if (!response.ok) throw new Error('Failed to submit review');
  return response.json();
}
```

Also add TypeScript types to `types.ts`:
```typescript
export type CurriculumPayload = {
  framework: string;
  tracks: {
    vocab: CurriculumLesson[];
    grammar: CurriculumLesson[];
  };
};

export type CurriculumLesson = {
  id: string;
  order: number;
  level: string;
  title: string;
  topic_ielts?: string;
  focus_en?: string;
  objective_en?: string;
};

export type TrackLessonPayload = LessonPayload & {
  track: 'vocab' | 'grammar';
  lesson_meta: CurriculumLesson;
  sequence: string[];
};

export type ReviewPayload = {
  learner_id: number;
  mode: 'due' | 'weak' | 'fresh';
  items: Array<WordItem & { memory_strength: number; review_due_at?: string }>;
};
```

**Effort:** 1 hour  
**Testing:** Run TypeScript check, verify compile without errors

### ACTION 3: Create ReviewScreen Component (CRITICAL)
**Location:** Create `frontend/src/screens/ReviewScreen.tsx`  
**Purpose:** Allow users to practice weak/due items

```typescript
import React, { useState } from 'react';
import { ReviewPayload } from '../types';

interface ReviewScreenProps {
  review: ReviewPayload;
  onSubmit: (answers: Array<{wordId: number; correct: boolean}>) => void;
  onCancel: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ review, onSubmit, onCancel }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{wordId: number; correct: boolean}>>([]);
  
  const current = review.items[index];
  const isDone = index >= review.items.length;
  const progressPct = Math.round((index / review.items.length) * 100);
  
  const handleCorrect = () => {
    setAnswers([...answers, {wordId: current.id, correct: true}]);
    if (index < review.items.length - 1) {
      setIndex(index + 1);
    }
  };
  
  const handleIncorrect = () => {
    setAnswers([...answers, {wordId: current.id, correct: false}]);
    if (index < review.items.length - 1) {
      setIndex(index + 1);
    }
  };
  
  const handleSubmit = () => {
    onSubmit(answers);
  };
  
  if (isDone) {
    return (
      <main className="page">
        <section className="card">
          <h2>Review complete!</h2>
          <p>Score: {Math.round((answers.filter(a => a.correct).length / answers.length) * 100)}%</p>
          <button onClick={handleSubmit}>Finish</button>
        </section>
      </main>
    );
  }
  
  return (
    <main className="page">
      <section className="card">
        <div className="progress-head">
          <span>Review: {review.mode} mode</span>
          <span>{progressPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{width: `${progressPct}%`}} />
        </div>
        
        <div className="badge">Review word</div>
        <h2>{current.word} {current.ipa}</h2>
        <p>{current.meaning_vi}</p>
        <p className="example">Example: {current.example_sentence}</p>
        
        <div className="button-row">
          <button onClick={handleIncorrect} className="secondary-btn">
            ✗ Need practice
          </button>
          <button onClick={handleCorrect} className="primary-btn">
            ✓ Got it
          </button>
        </div>
      </section>
    </main>
  );
};

export default ReviewScreen;
```

**Effort:** 1.5 hours  
**Testing:** Rendered screen, test button interactions

### ACTION 4: Verify Vocabulary Seed Data (CRITICAL)
**Location:** `english_foundation/content/vocabulary_seed.json`  
**Check:**

```bash
cd english_foundation

# 1. Check if file exists
ls -la content/vocabulary_seed.json

# 2. Check file size (should be >100KB)
stat content/vocabulary_seed.json

# 3. Validate JSON structure
python -c "import json; data=json.load(open('content/vocabulary_seed.json')); print(f'Words: {len(data)}')"

# 4. Run bootstrap to populate DB
python -m db.bootstrap

# 5. Check vocab count in DB
sqlite3 db/english_foundation.db "SELECT COUNT(*) FROM vocabulary;"

# 6. Check diversity by difficulty
sqlite3 db/english_foundation.db "SELECT difficulty, COUNT(*) FROM vocabulary GROUP BY difficulty;"

# 7. Check lesson coverage
sqlite3 db/english_foundation.db "SELECT topic_ielts, COUNT(*) FROM vocabulary WHERE topic_ielts IS NOT NULL GROUP BY topic_ielts;"
```

If missing or incomplete:
1. **Generate from existing data:**
   ```bash
   python scripts/generate_vocab_from_txt.py  # Uses ielts_vocab_cleaned.txt
   ```

2. **Validate curriculum-seed alignment:**
   ```python
   # Validate each curriculum lesson has 20+ vocabulary items
   # Check each topic_ielts has words
   # Verify no gaps in difficulty 1-5
   ```

**Effort:** 1-2 hours  
**Result:** Confirmed vocabulary_seed.json has ✅ sufficiently populated database

---

## 🔧 Next Week (High Priority)

### ACTION 5: Add Grammar Explanations (HIGH)
**Location:** `english_foundation/db/schema.sql`  
**Current:** Grammar units only have pattern + example  
**Change:**

```sql
-- Add to grammar_units table
ALTER TABLE grammar_units ADD COLUMN explanation_vi TEXT;
ALTER TABLE grammar_units ADD COLUMN explanation_en TEXT;
ALTER TABLE grammar_units ADD COLUMN usage_note TEXT;
ALTER TABLE grammar_units ADD COLUMN native_example_vi TEXT;

-- Example data
INSERT INTO grammar_units (pattern, example, difficulty, explanation_vi, explanation_en, usage_note, native_example_vi)
VALUES (
  'Simple Present Affirmative',
  'I eat breakfast every day',
  1,
  'Chúng ta dùng để nói về hành động thường lặp lại',
  'Used for repeated actions and facts',
  'Use with adverbs of frequency: always, usually, sometimes, never',
  'Tôi ăn bánh mì mỗi sáng'
);
```

**Sources for explanations:**
- Use existing grammar learning resources
- Convert from CEFR A1-B1 framework docs
- Reference Cambridge English grading guides

**Effort:** 3-5 hours (content curation + DB update)

### ACTION 6: Extend Curriculum to A2/B1 (HIGH)
**Location:** `english_foundation/content/cambridge_curriculum.json`  
**Current:** 8 A1 lessons complete, A2 started  
**Required:** 15-20 more lessons (A2: 8-10, B1: 7-10)

**A2 Lesson Template:**
```json
{
  "id": "VOC-A2-XX",
  "order": 10,
  "level": "A2",
  "title": "[Topic Name]",
  "topic_ielts": "[IELTS Category]",
  "focus_en": "[Key vocabulary]",
  "focus_vi": "[Từ vựng khoá]",
  "objective_en": "[Learning goal]",
  "objective_vi": "[Mục tiêu]",
  "cefr_target": "A2",
  "coca_frequency_band": "1001-5000",
  "source_standard": "open-triangulated",
  "source_refs": ["Cambridge CEFR", "COCA", "Oxford3000+"]
}
```

**Topics to add:**
```
A2 VOCAB (8 lessons):
1. Shopping and money
2. Transport and travel
3. Technology basics
4. Sports and leisure
5. Environmental topics
6. Work and employment
7. Social interactions
8. Opinions and preferences

B1 GRAMMAR/VOCAB (7 lessons):
1. Complex sentences
2. Conditionals
3. Comparative/superlative
4. Passive voice intro
5. Modal verbs
6. Pharasal verbs
7. Topic-based advanced vocab
```

**Effort:** 8-10 hours (topic research + content sourcing)

### ACTION 7: Integrate Text-to-Speech for Pronunciation (MEDIUM)
**Location:** `frontend/src/components/` + backend enhancements

**Options:**
1. **Azure Speech Service** (Recommended - already in project)
   ```typescript
   // frontend/src/services/audioService.ts
   import { CognitiveServicesCredentials } from "@azure/cognitiveservices-speech";
   import * as sdk from "microsoft-cognitiveservices-speech-sdk";
   
   async function playPronunciation(word: string): Promise<void> {
     const speechConfig = sdk.SpeechConfig.fromSubscription(
       process.env.REACT_APP_AZURE_SPEECH_KEY!,
       process.env.REACT_APP_AZURE_SPEECH_REGION!
     );
     
     const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
     const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
     
     synthesizer.speakTextAsync(word, () => {}, (err) => console.error(err));
   }
   ```

2. **Google Cloud TTS** (Free tier available)
3. **Web Audio API + prerecorded files** (Simplest)

**Effort:** 2-3 hours (API integration + button in LessonScreen)

---

## 📋 Completion Checklist

### By End of This Week ✅
- [ ] Answer submission connected in LessonScreen
- [ ] 6 API methods added to learningApi.ts
- [ ] ReviewScreen component created
- [ ] Vocabulary seed data verified + DB populated
- [ ] All TypeScript errors resolved

### By End of Next Week 🔧
- [ ] Grammar explanations schema + data populated
- [ ] A2 curriculum lessons defined (8+ lessons)
- [ ] TTS/audio playback working
- [ ] Manual E2E test: complete A1 lesson → review → A2 lesson

### By End of Month 📊
- [ ] B1 curriculum lessons defined
- [ ] Progress dashboard basic version
- [ ] Analytics: learner profile + progress tracking
- [ ] Docker build + staging deployment

---

## 🧪 Testing After Each Change

### After Action 1 (Answer Submission):
```
1. Open browser DevTools
2. Start lesson
3. Click card response button
4. Check Network tab - should see POST to /api/foundation/vocab-check
5. Verify response includes score + weak_items
6. Check ProgressScreen - learned_words should increment
```

### After Action 2 (API Methods):
```
1. npm run build (in frontend)
2. TypeScript should have zero errors
3. Each function should be callable: submitVocabCheck(1, "test", [...])
```

### After Action 3 (ReviewScreen):
```
1. Manual render test:
   <ReviewScreen review={mockReviewData} onSubmit={...} onCancel={...} />
2. Click through review items
3. Check submission sends correct answers
```

### After Action 4 (Vocab Data):
```
Run verification:
sqlite3 db/english_foundation.db << EOF
SELECT COUNT(*) as total_words FROM vocabulary;
SELECT difficulty, COUNT(*) FROM vocabulary GROUP BY difficulty;
SELECT topic_ielts, COUNT(*) FROM vocabulary 
WHERE topic_ielts IS NOT NULL 
GROUP BY topic_ielts;
EOF
```

---

## 🎯 Success Criteria

### Working End-to-End Flow (Week 1):
1. ✅ User completes lesson (views 5+ cards)
2. ✅ User provides feedback (correct/skip)
3. ✅ Answers submitted to backend
4. ✅ Progress page updates with new stats
5. ✅ Can repeat lesson, see same or different items

### Review Working (Week 2):
1. ✅ User can access Review screen
2. ✅ Review shows due/weak/fresh items
3. ✅ User practices weak words
4. ✅ Progress updates correctly
5. ✅ Review due dates recalculate (SM2)

### Full Curriculum Accessible (Week 3):
1. ✅ All A1+A2 lessons defined
2. ✅ Can select specific lesson (not just auto-sequence)
3. ✅ B1 lessons visible (even if started)
4. ✅ Grammar explanations display

---

## 📞 Blockers & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Vocabulary data incomplete | 🟠 MEDIUM | High - lessons fail | Verify now (Action 4) |
| TypeScript type mismatch | 🟡 LOW | Medium - won't compile | Use provided types |
| Backend route not found | 🟡 LOW | High - API fails | Test endpoints manually |
| Frontend state management issues | 🟠 MEDIUM | High - UI bugs | Use React DevTools |
| A2 content sourcing | 🟠 MEDIUM | Medium - delays lessons | Start immediately |

---

## 📅 Timeline Summary

```
WEEK 1 (Mar 19-25)
├─ Mon: Actions 1-2 (Answer submission + API methods)
├─ Tue: Action 3 (ReviewScreen)
├─ Wed: Action 4 (Verify vocab data)
├─ Thu-Fri: Testing + bug fixes
└─ Outcome: Core learning loop functional ✅

WEEK 2 (Mar 26-Apr 1)
├─ Action 5: Grammar explanations
├─ Action 6: A2 curriculum
├─ Action 7: Text-to-speech
└─ Outcome: Extended feature set ✅

WEEK 3-4
├─ Analytics dashboard
├─ Performance optimization
├─ Mobile testing
└─ Outcome: Production ready 🚀
```

---

**Next Step:** Start with Action 1 immediately to unblock the learning flow.  
**Questions?** Contact the module owner before proceeding.

