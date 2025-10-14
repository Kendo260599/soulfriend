# Clean Up Debug Logs

## Current Debug Logs (causing red messages in Railway)

These are NOT errors, just debug information using console.error() for visibility.

### Files with debug logging:

1. **backend/src/services/enhancedChatbotService.ts**
   - Version logging
   - Hex dump logging
   - Crisis detection debug
   - Final response logging

2. **backend/src/data/crisisManagementData.ts**
   - Crisis detection normalization debug
   - Match result logging

3. **backend/src/services/criticalInterventionService.ts**
   - HITL activation logs
   - Escalation timer logs

## Options to Clean Up:

### Option 1: Keep for Production Monitoring
✅ **RECOMMENDED**

Keep the logs but change to logger.debug() instead of console.error():

```typescript
// Instead of:
console.error('🔍 CRISIS DEBUG: ...')

// Use:
logger.debug('🔍 CRISIS DEBUG: ...')
```

Railway won't show debug level logs by default → cleaner dashboard

### Option 2: Remove All Debug Logs
⚠️ Not recommended - harder to troubleshoot issues

### Option 3: Environment-based Logging
Only show debug logs in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('🔍 DEBUG: ...')
}
```

## Quick Fix Script

To change console.error() to logger.debug() for debug messages:

```bash
# Find all debug console.error calls
grep -r "console.error.*🔍" backend/src/

# Replace with logger.debug (manual for now)
```

## What to Keep:

### Keep as ERROR level (important):
- 🚨 CRISIS DETECTED (real crisis)
- 🚨 HITL Alert created (HITL activation)
- ❌ Actual errors and exceptions

### Change to DEBUG level (noise):
- 🔍 CRISIS DEBUG messages
- 📝 Input logging
- 📤 Response logging
- 🔢 Hex dumps

## Immediate Action:

**For now:** No action needed. These "errors" are actually working as intended.

**After verification:** Can clean up to reduce log noise.

