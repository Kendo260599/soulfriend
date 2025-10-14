# UTF-8 Encoding Investigation Report

## 📅 Date: 2025-10-14
## 🔍 Issue: Crisis Detection Not Working in Production

---

## 🎯 **ROOT CAUSE DISCOVERED:**

### **Vietnamese Diacritics Corruption**

**Symptoms:**
```
Expected: "Tôi muốn tự tử, tôi không thể chịu đựng được nữa"
Railway Logs: "T�i mu?n t? t?, t�i kh�ng th? ch?u d?ng du?c n?a"
```

**Character Mapping:**
- `ô` → `�` (replacement character)
- `ơ` → `?` (question mark)
- `ự` → `?`
- `ử` → `?`
- `ế` → `?`
- `ứ` → `?`
- `ượ` → `u?`

**Impact:**
- Crisis triggers: `"tự tử"` → Actual text: `"t? t?"` → **NO MATCH**
- HITL system never activates
- Users in crisis receive generic responses

---

## 🔬 **Investigation Timeline**

### Stage 1: Initial Debugging (30+ commits)
- ✅ Added extensive debug logging
- ✅ Fixed TypeScript types
- ✅ Verified `detectCrisis()` function works standalone
- ✅ Verified Railway deployment successful
- ❌ API still returns LOW risk

### Stage 2: Debug Endpoint Analysis
- ✅ Created `/debug/crisis-test` endpoint
- ✅ Confirmed: Function works when called directly
- ❌ Full API flow still fails

### Stage 3: Railway Logs Analysis  
- 🔍 Discovered Vietnamese diacritics corruption in logs
- 📝 Input shows: `"T�i mu?n t? t?"`
- 🚨 **BREAKTHROUGH:** UTF-8 encoding issue identified!

### Stage 4: Fix Implementation
- ✅ Added `removeVietnameseDiacritics()` function
- ✅ Modified `detectCrisis()` to normalize text
- ✅ Added hex dump logging to verify actual bytes
- ⏳ Waiting for Railway deployment and hex dump verification

---

## 💡 **Solutions Implemented**

### 1. **Vietnamese Diacritics Normalization**

**File:** `backend/src/data/crisisManagementData.ts`

```typescript
function removeVietnameseDiacritics(str: string): string {
  const diacriticsMap: { [key: string]: string } = {
    'ô': 'o', 'ơ': 'o', 'ư': 'u', 'ự': 'u', 'ế': 'e', ...
  };
  return str.toLowerCase()
    .split('')
    .map(char => diacriticsMap[char] || char)
    .join('');
}
```

**Logic:**
1. Try matching with original triggers (with diacritics)
2. Fallback to normalized matching (diacritics removed)
3. Either match succeeds → Crisis detected ✅

### 2. **Hex Dump Debugging**

**File:** `backend/src/services/enhancedChatbotService.ts`

```typescript
const messageBytes = Buffer.from(message, 'utf8');
const messageHex = messageBytes.toString('hex').substring(0, 100);
console.error(`🔢 Message HEX: ${messageHex}`);
console.error(`📏 Byte length: ${messageBytes.length} | char length: ${message.length}`);
```

**Purpose:**
- Verify if data is actually corrupted or just logs display issue
- Compare hex values with expected UTF-8 encoding

### 3. **Enhanced Debug Output**

**detectCrisis() now logs:**
```
🔍 CRISIS DETECTION DEBUG:
   Original: "Tôi muốn tự tử..."
   Lowercase: "tôi muốn tự tử..."
   Normalized: "toi muon tu tu..."
   ✅ MATCHED: suicidal_ideation (critical)
```

---

## 🧪 **Test Results**

### Local Tests (Windows PowerShell UTF-8)
```
✅ "tôi muốn tự tử" → suicidal_ideation (CRITICAL)
✅ "Tôi muốn tự tử, tôi không thể chịu đựng được nữa" → suicidal_ideation (CRITICAL)
✅ "không muốn sống nữa" → suicidal_ideation (CRITICAL)
✅ "muốn chết" → suicidal_ideation (CRITICAL)
✅ "xin chào" → null (no crisis)
```

### Corrupted Text Tests
```
❌ "T�i mu?n t? t?" → null (no match)
❌ "kh�ng mu?n s?ng n?a" → null (no match)
❌ "mu?n ch?t" → null (no match)
```

**Conclusion:** Normalization works for proper UTF-8, but not for already-corrupted replacement characters.

### Production Tests (Railway)
```
Before fix:
❌ API returns LOW risk for crisis messages

After fix (pending hex dump verification):
⏳ Need to check if data is:
   1. Actually corrupted → Need Express/Railway UTF-8 config
   2. Just logs display issue → Normalization should work
```

---

## 🔍 **Next Steps - WAITING FOR USER**

### **CRITICAL: Check Railway Logs**

User needs to provide hex dump output from latest deployment:

**Look for:**
```
🔍 EnhancedChatbotService v2.1 - Processing message
📝 Input: "..."
🔢 Message HEX (first 50 bytes): [DATA HERE]
📏 Message byte length: XX | char length: YY
🔍 CRISIS DETECTION DEBUG:
   Original: "..."
   Normalized: "..."
   ✅ MATCHED or ❌ NO MATCH
```

### **Hex Analysis Guide**

**Expected UTF-8 hex for "Tôi muốn tự tử":**
```
54 c3 b4 69 20 6d 75 e1 bb 91 6e 20 74 e1 bb b1 20 74 e1 bb ad
T  ô        i     m  u  ố        n     t  ự        t  ử
```

**If hex matches:** Data is correct → Logs just display wrong → Normalization should work ✅

**If hex is corrupted:** Data is wrong → Need Express body-parser UTF-8 config ❌

---

## 🛠️ **Potential Additional Fixes**

### If Data is Actually Corrupted:

#### Option 1: Express body-parser UTF-8
```typescript
app.use(express.json({ 
  limit: '10mb',
  charset: 'utf-8'  // Explicit UTF-8
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  charset: 'utf-8'  // Explicit UTF-8
}));
```

#### Option 2: Railway Environment
```bash
# railway.toml
[build]
LANG = "en_US.UTF-8"
LC_ALL = "en_US.UTF-8"
```

#### Option 3: Content-Type validation middleware
```typescript
app.use((req, res, next) => {
  const contentType = req.get('Content-Type');
  if (contentType && !contentType.includes('charset=utf-8')) {
    console.warn('Missing UTF-8 charset in Content-Type');
  }
  next();
});
```

---

## 📊 **Files Modified**

### Crisis Detection Logic
- `backend/src/data/crisisManagementData.ts` - Added normalization
- `backend/src/services/enhancedChatbotService.ts` - Added hex dump

### Debug & Testing
- `backend/test-crisis-import.ts` - Standalone function test
- `backend/test-corrupted-text.ts` - Corrupted text simulation
- `backend/test-detectCrisis-detailed.ts` - Detailed analysis
- `test-crisis-detection-final.ps1` - Production API test
- `monitor-deployment.html` - Browser-based monitoring

### Routes & Controllers
- `backend/src/routes/chatbot.ts` - Added debug endpoints
- `backend/src/controllers/chatbotController.ts` - Uses EnhancedChatbotService

---

## 📈 **Deployment History**

- **v1.0.0** - Initial crisis detection
- **v1.0.1** - Force rebuild, added extensive logging
- **v1.0.1-debug** - Added debug endpoints
- **v2.1** - Vietnamese normalization + hex dump (current)

---

## 🎯 **Success Criteria**

### Must Have
- ✅ Crisis message "tôi muốn tự tử" → riskLevel: CRITICAL
- ✅ HITL system activates for crisis
- ✅ Emergency contacts returned
- ✅ Proper crisis response message

### Verification
```bash
# Test command
curl -X POST https://soulfriend-production.up.railway.app/api/v2/chatbot/message \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"message":"Tôi muốn tự tử","userId":"test","sessionId":"test"}'

# Expected response
{
  "data": {
    "riskLevel": "CRITICAL",
    "crisisLevel": "critical",
    "emergencyContacts": [{...}],
    ...
  }
}
```

---

## 🔗 **References**

- Railway Dashboard: https://railway.app/dashboard
- Backend Health: https://soulfriend-production.up.railway.app/api/health
- Debug Endpoint: https://soulfriend-production.up.railway.app/api/v2/chatbot/debug/crisis-test
- Version Check: https://soulfriend-production.up.railway.app/api/v2/chatbot/debug/version

---

**Status:** ⏳ **WAITING FOR RAILWAY LOGS HEX DUMP VERIFICATION**

**Next Action:** User provides hex dump data from Railway logs

