# ✅ SoulFriend Deployment Checklist

## 🎯 PRE-DEPLOYMENT CHECKLIST

### Local Testing
- [x] ✅ Backend running successfully
- [x] ✅ Frontend running successfully  
- [x] ✅ Chatbot AI responding (Gemini 2.5 Flash)
- [x] ✅ All tests passing
- [x] ✅ No TypeScript errors
- [x] ✅ Proxy configured

### Code Preparation
- [x] ✅ Git initialized
- [x] ✅ .gitignore created
- [x] ✅ Environment variables documented
- [x] ✅ Deployment configs created (render.yaml, vercel.json)
- [x] ✅ Documentation complete

### Security
- [x] ✅ API keys not in code
- [x] ✅ Environment variables for secrets
- [x] ✅ CORS configured
- [x] ✅ HTTPS will be enabled (auto by platforms)

---

## 📤 DEPLOYMENT STEPS

### Step 1: GitHub Setup
- [ ] Create GitHub account (if needed)
- [ ] Create repository: `soulfriend`
- [ ] Run: `.\github-push.ps1`
- [ ] Verify code is on GitHub
- [ ] **URL:** https://github.com/YOUR_USERNAME/soulfriend

### Step 2: Backend Deployment (Render)
- [ ] Create Render account: https://render.com
- [ ] Connect GitHub account
- [ ] Create new Web Service
- [ ] Select repository: `soulfriend`
- [ ] Configure:
  - **Name:** soulfriend-api
  - **Region:** Singapore
  - **Root Directory:** backend
  - **Build Command:** npm install
  - **Start Command:** node simple-gemini-server.js
- [ ] Add Environment Variables:
  - `NODE_ENV` = `production`
  - `PORT` = `5000`
  - `GEMINI_API_KEY` = `AIzaSyC2tzM5BF-g6fIU3Hqr2V6ipq5H1gjCn3k`
  - `CORS_ORIGIN` = `https://soulfriend.vercel.app`
- [ ] Deploy (wait 5-10 minutes)
- [ ] Copy backend URL: `https://soulfriend-api.onrender.com`
- [ ] Test: `https://soulfriend-api.onrender.com/api/health`

### Step 3: Frontend Deployment (Vercel)
- [ ] Create Vercel account: https://vercel.com
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Update frontend/.env.production:
  ```
  REACT_APP_API_URL=https://soulfriend-api.onrender.com
  ```
- [ ] Deploy: `cd frontend && vercel --prod`
- [ ] Or use Vercel dashboard to import from GitHub
- [ ] Add Environment Variable in dashboard:
  - `REACT_APP_API_URL` = `https://soulfriend-api.onrender.com`
- [ ] Copy frontend URL: `https://soulfriend.vercel.app`
- [ ] Test: Open URL in browser

### Step 4: Update CORS
- [ ] Go back to Render dashboard
- [ ] Update `CORS_ORIGIN` to match Vercel URL
- [ ] Redeploy backend if needed

---

## 🧪 POST-DEPLOYMENT TESTING

### Backend Tests
- [ ] Health check returns 200:
  ```powershell
  Invoke-WebRequest https://soulfriend-api.onrender.com/api/health
  ```
- [ ] Chatbot endpoint works:
  ```powershell
  $body = @{ message = "test"; userId = "test"; sessionId = "test123" } | ConvertTo-Json
  Invoke-WebRequest -Uri "https://soulfriend-api.onrender.com/api/v2/chatbot/message" -Method POST -ContentType "application/json" -Body $body
  ```
- [ ] AI response is received
- [ ] Response time < 5 seconds (after cold start)

### Frontend Tests
- [ ] Website loads: https://soulfriend.vercel.app
- [ ] All pages render correctly
- [ ] No console errors (F12)
- [ ] Chatbot button visible
- [ ] Chatbot opens successfully

### Integration Tests
- [ ] Chatbot sends message
- [ ] Chatbot receives AI response
- [ ] Crisis detection works
- [ ] Emergency contacts display
- [ ] Test results save (if database connected)

### Performance Tests
- [ ] First load < 3 seconds
- [ ] Subsequent loads < 1 second
- [ ] Chatbot response < 2 seconds (warm)
- [ ] Chatbot response < 30 seconds (cold start)

---

## 🔒 SECURITY CHECKLIST

### SSL/HTTPS
- [ ] Backend has HTTPS (auto by Render)
- [ ] Frontend has HTTPS (auto by Vercel)
- [ ] Green padlock in browser

### Environment Variables
- [ ] No secrets in code
- [ ] .env files not committed
- [ ] Environment variables set in dashboards
- [ ] API key working

### CORS
- [ ] CORS allows only your frontend domain
- [ ] No CORS errors in console
- [ ] API requests successful

### Privacy
- [ ] Privacy policy visible
- [ ] Consent form implemented
- [ ] Emergency contacts displayed
- [ ] Disclaimer about AI limitations

---

## 📊 MONITORING SETUP

### Render Monitoring
- [ ] Enable health checks
- [ ] Set up alerts (optional)
- [ ] Review logs regularly

### Vercel Analytics
- [ ] Enable analytics (optional)
- [ ] Track page views
- [ ] Monitor errors

### Custom Monitoring
- [ ] Setup error tracking (Sentry, optional)
- [ ] Monitor API usage
- [ ] Track user feedback

---

## 🎓 RESEARCH COMPLIANCE

### IRB/Ethics (if applicable)
- [ ] IRB protocol submitted
- [ ] IRB approval received
- [ ] Consent form approved
- [ ] Data handling plan approved

### Privacy & Data Protection
- [ ] Privacy policy published
- [ ] Data encryption enabled
- [ ] Participant anonymization
- [ ] Data retention policy
- [ ] Right to withdraw implemented

### Documentation
- [ ] Research protocol documented
- [ ] Data collection methods documented
- [ ] Analysis plan defined
- [ ] Ethical considerations addressed

---

## 📱 USER TESTING

### Beta Testing
- [ ] Recruit 5-10 beta testers
- [ ] Provide testing guidelines
- [ ] Collect feedback
- [ ] Fix critical bugs

### Usability Testing
- [ ] Test with target audience (Vietnamese women)
- [ ] Verify language/cultural appropriateness
- [ ] Test on different devices (mobile, tablet, desktop)
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### Feedback Collection
- [ ] Setup feedback form
- [ ] Monitor user comments
- [ ] Track issues/bugs
- [ ] Plan improvements

---

## 🚀 LAUNCH CHECKLIST

### Pre-Launch
- [ ] All tests passing
- [ ] Beta feedback addressed
- [ ] Performance optimized
- [ ] Monitoring active
- [ ] Backup plan ready

### Launch Day
- [ ] Announce to target audience
- [ ] Monitor closely for first 24 hours
- [ ] Respond to user feedback
- [ ] Fix urgent issues quickly

### Post-Launch
- [ ] Daily monitoring (first week)
- [ ] Weekly monitoring (first month)
- [ ] Regular updates and improvements
- [ ] Collect research data

---

## 💰 COST TRACKING

### Free Tier Usage
- [ ] Vercel: Track bandwidth usage
- [ ] Render: Track hours used (750/month free)
- [ ] MongoDB: Track storage (512MB free)

### When to Upgrade
- [ ] Backend cold starts affecting UX → Upgrade Render ($7/month)
- [ ] High traffic → Upgrade Vercel ($20/month)
- [ ] Database full → Upgrade MongoDB ($9/month)

---

## 🆘 EMERGENCY PROCEDURES

### If Backend Goes Down
1. Check Render status dashboard
2. View deployment logs
3. Redeploy if needed
4. Contact Render support if persistent

### If Frontend Goes Down
1. Check Vercel status
2. View deployment logs
3. Rollback to previous deployment if needed
4. Contact Vercel support

### If Database Issues
1. Check MongoDB Atlas status
2. Verify connection string
3. Check network access whitelist
4. Contact MongoDB support

---

## 📞 SUPPORT CONTACTS

### Technical Support
- **Vercel:** https://vercel.com/support
- **Render:** support@render.com
- **MongoDB:** https://www.mongodb.com/support

### Community Help
- **Vercel Discord:** https://vercel.com/discord
- **Render Community:** https://community.render.com/
- **Stack Overflow:** Tag with `vercel`, `render`, `react`, `node.js`

---

## ✅ FINAL VERIFICATION

### URLs Working
- [ ] Backend API: https://soulfriend-api.onrender.com
- [ ] Frontend App: https://soulfriend.vercel.app
- [ ] Both return 200 OK

### Core Features
- [ ] Chatbot AI working
- [ ] Mental health tests functional
- [ ] Video guides loading
- [ ] Emergency contacts visible

### Documentation
- [ ] User guide available
- [ ] Privacy policy visible
- [ ] Contact information provided
- [ ] Emergency procedures documented

---

## 🎉 DEPLOYMENT COMPLETE!

When all items are checked:
- ✅ **SoulFriend is LIVE!**
- ✅ **Ready for research participants**
- ✅ **Helping Vietnamese women with mental health support**

---

**Next Steps:**
1. Share URL with target audience
2. Monitor usage and feedback
3. Iterate and improve
4. Collect research data
5. Publish findings

**🌸 Congratulations on deploying SoulFriend!**

---

**Deployment Date:** _____________  
**Backend URL:** https://soulfriend-api.onrender.com  
**Frontend URL:** https://soulfriend.vercel.app  
**Deployed By:** _____________

