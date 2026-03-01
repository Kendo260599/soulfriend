# UTF-8 Encoding Fix - Visual Flow

## BEFORE FIX (❌ BROKEN)

```
┌─────────────────────────────────────────────────────────────┐
│ User sends: "Tôi muốn tự tử"                                │
│ (UTF-8 bytes: 54 C3 B4 69 20 6D C6 B0 E1 BB 9B 6E...)      │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Express Body Parser (Default)                             │
│ ❌ Incorrect decoding                                     │
│ "Tôi" → "T�i" (efbfbd = � replacement char)              │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Controller receives:                                      │
│ message = "T�i mu?n t? t?"                                │
│ ❌ Corrupted Vietnamese                                   │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Crisis Detection                                          │
│ Searches for: "tự tử", "muốn chết"                       │
│ In corrupted: "t? t?", "mu?n ch?t"                       │
│ ❌ NO MATCH!                                              │
└───────────────────────┬───────────────────────────────────┘
                        ↓
                ❌ Risk Level: LOW
                (Should be CRITICAL!)
```

---

## AFTER FIX (✅ WORKING)

```
┌─────────────────────────────────────────────────────────────┐
│ User sends: "Tôi muốn tự tử"                                │
│ (UTF-8 bytes: 54 C3 B4 69 20 6D C6 B0 E1 BB 9B 6E...)      │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Express Body Parser (Enhanced)                            │
│ + verify: (req, res, buf) => {                           │
│     req.rawBody = buf.toString('utf8')                    │
│   }                                                       │
│ ✅ Preserves raw UTF-8 bytes                             │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ UTF-8 Fix Middleware ⭐ NEW                               │
│ 1. Check for � (corruption marker)                        │
│ 2. If corrupted → Use req.rawBody                         │
│ 3. Apply NFC normalization:                               │
│    - "o" + "̂" + "̃" → "ô" + "̃" → "ỗ"                  │
│ ✅ Clean Vietnamese characters                            │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Controller receives:                                      │
│ message = "Tôi muốn tự tử"                                │
│ ✅ Perfect Vietnamese!                                    │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ Crisis Detection                                          │
│ Searches for: "tự tử", "muốn chết"                       │
│ In clean text: "Tôi muốn tự tử"                          │
│ ✅ MATCH FOUND!                                           │
│                                                           │
│ Detected: self_harm scenario                             │
│ Level: critical                                           │
│ Triggers: ["tự tử"]                                       │
└───────────────────────┬───────────────────────────────────┘
                        ↓
                ✅ Risk Level: CRITICAL
                ✅ HITL Alert: SENT
                ✅ Emergency Contacts: SHOWN
```

---

## UNICODE NORMALIZATION (NFC)

### What is NFC?
**Canonical Composition** - Combines base character + diacritics

### Example: Vietnamese "ỗ"

```
BEFORE NORMALIZATION (NFD - Decomposed):
┌───┬───┬───┐
│ o │ ̂ │ ̃ │  ← 3 separate codepoints
└───┴───┴───┘
U+006F U+0302 U+0303

AFTER NORMALIZATION (NFC - Composed):
┌───┬───┐
│ ô │ ̃ │  ← 2 codepoints (o+̂ combined)
└───┴───┘
U+00F4 U+0303

FULLY COMPOSED (if available):
┌───┐
│ ỗ │  ← 1 codepoint (fully precomposed)
└───┘
U+1ED7
```

### Why Important?
- **Matching**: "tôi" with composed ô matches user input
- **Storage**: Consistent format in database
- **Display**: Proper rendering across all devices

---

## CODE FLOW DIAGRAM

```
index.ts
  ↓
  ├─ CORS middleware
  ├─ Helmet security
  ├─ express.json({ verify: ... }) ← Save rawBody
  ├─ express.urlencoded({ extended: true })
  ├─ express.text({ defaultCharset: 'utf-8' })
  │
  ├─ UTF-8 FIX MIDDLEWARE ⭐ NEW
  │   ↓
  │   ├─ Check req.body for corruption
  │   ├─ If has �: Use req.rawBody
  │   ├─ Apply .normalize('NFC')
  │   └─ Return clean Vietnamese
  │
  ├─ Rate limiters
  ├─ Routes
  │   ↓
  │   └─ chatbotController.ts
  │       ↓
  │       ├─ Receive clean message
  │       ├─ memoryAwareChatbotService.chat()
  │       │   ↓
  │       │   └─ enhancedChatbotService.processMessage()
  │       │       ↓
  │       │       └─ detectCrisis(message)
  │       │           ↓
  │       │           ├─ Clean text: "Tôi muốn tự tử"
  │       │           ├─ Match trigger: "tự tử"
  │       │           └─ Return: { level: 'critical' }
  │       │
  │       └─ Response: { riskLevel: 'CRITICAL' }
  │
  └─ Error handler
```

---

## BYTE-LEVEL ANALYSIS

### Correct UTF-8 Encoding

```
Character: Tôi muốn tự tử

T   = 54
ô   = C3 B4    (2 bytes)
i   = 69
    = 20
m   = 6D
ư   = C6 B0    (2 bytes)
ớ   = E1 BB 9B (3 bytes)
n   = 6E
    = 20
t   = 74
ự   = E1 BB B1 (3 bytes)
    = 20
t   = 74
ử   = E1 BB AD (3 bytes)

Total: 23 bytes for 12 characters
```

### Corrupted (Before Fix)

```
T   = 54
�   = EF BF BD (replacement character)
i   = 69
?   = 3F
...

❌ Diacritics lost!
```

---

## KEY TAKEAWAYS

1. **Always preserve raw body** for UTF-8 recovery
2. **Normalize with NFC** for consistent Vietnamese
3. **Check for �** to detect corruption early
4. **Test with real Vietnamese** before deploy
5. **Monitor logs** for encoding issues

---

## FILES CHANGED

| File | Lines | Change |
|------|-------|--------|
| `backend/src/index.ts` | +40 | UTF-8 middleware |
| `test-vietnamese-encoding.ps1` | +70 | Automated tests |
| `UTF8_ENCODING_FIX.md` | +280 | Documentation |

**Commit**: 128f67e  
**Status**: 🟡 Deployed - Testing pending
