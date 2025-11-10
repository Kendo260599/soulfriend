# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP

## Quick Setup via Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select project: **soulfriend**
3. Settings → Environment Variables
4. Add new variable:

\\\
Key: REACT_APP_API_URL
Value: https://soulfriend-api.onrender.com

Environments:
☑ Production
☑ Preview  
☑ Development
\\\

5. Save and Redeploy

---

## Or via Vercel CLI:

\\\powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variable
vercel env add REACT_APP_API_URL production

# When prompted, enter:
https://soulfriend-api.onrender.com

# Also add for preview and development
vercel env add REACT_APP_API_URL preview
vercel env add REACT_APP_API_URL development

# Redeploy
vercel --prod
\\\

---

## Verify:

After deployment, check in browser console:

\\\javascript
console.log(process.env.REACT_APP_API_URL);
// Should output: https://soulfriend-api.onrender.com
\\\

---

## ✅ Checklist:

- [ ] Add REACT_APP_API_URL to Vercel (Production)
- [ ] Add REACT_APP_API_URL to Vercel (Preview)
- [ ] Add REACT_APP_API_URL to Vercel (Development)
- [ ] Trigger Vercel redeploy
- [ ] Test API connection from frontend
- [ ] Test Socket.io connection
- [ ] Verify CORS working

---

**Note:** Vercel will automatically use this environment variable during build.
The fallback URL in code is now also updated to https://soulfriend-api.onrender.com
