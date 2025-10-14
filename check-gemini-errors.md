# Gemini Free Tier Issues

## 🆓 Free Tier Limitations

### Quota Limits:
- **15 RPM** (Requests Per Minute)
- **1,500 RPD** (Requests Per Day)
- **32,000 TPM** (Tokens Per Minute)

### Common Errors:

1. **Rate Limit (429):**
```
Error: 429 RESOURCE_EXHAUSTED
Quota exceeded for quota metric 'Generate Content API requests per minute'
```

2. **Daily Quota (429):**
```
Error: 429 RESOURCE_EXHAUSTED
Quota exceeded for quota metric 'Generate Content API requests per day'
```

3. **Invalid API Key (400/403):**
```
Error: 400 INVALID_ARGUMENT: API key not valid
Error: 403 PERMISSION_DENIED
```

---
