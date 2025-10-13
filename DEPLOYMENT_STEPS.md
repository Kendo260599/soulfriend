# 🚀 SoulFriend Deployment Guide - Step by Step

## ✅ Current Status
- ✅ All changes committed and pushed to GitHub
- ✅ All tests passing (11/11)
- ✅ Railway CLI installed
- ✅ Ready for deployment

## 🎯 Deployment Steps (Railway Dashboard)

### Step 1: Deploy Backend
1. **Go to Railway Dashboard** (should be open in browser)
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your `soulfriend` repository**
5. **Select `backend` folder**
6. **Name it:** `soulfriend-backend`
7. **Click "Deploy"**

### Step 2: Configure Backend Environment Variables
In the backend project dashboard:
1. **Go to Variables tab**
2. **Add these variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/soulfriend
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this-in-production
ENCRYPTION_KEY=your-encryption-key-must-be-64-hex-characters-long-change-this-in-production
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@soulfriend.vn
DEFAULT_ADMIN_PASSWORD=ChangeThisSecurePassword123!
GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
```

### Step 3: Deploy Frontend
1. **Create another new project**
2. **Select "Deploy from GitHub repo"**
3. **Choose your `soulfriend` repository**
4. **Select `frontend` folder**
5. **Name it:** `soulfriend-frontend`
6. **Click "Deploy"**

### Step 4: Configure Frontend Environment Variables
In the frontend project dashboard:
1. **Go to Variables tab**
2. **Add these variables:**
```
REACT_APP_API_URL=https://soulfriend-backend-production.railway.app
REACT_APP_GEMINI_API_KEY=AIzaSyBaswf5ksxu1g7WvhS2_Hy7PHqWpjZu8LM
```

## 🔗 Important Notes

### Backend URL
- After backend deployment, copy the Railway URL (e.g., `https://soulfriend-backend-production.railway.app`)
- Use this URL in the frontend's `REACT_APP_API_URL` variable

### Database Setup
- You'll need a MongoDB Atlas database
- Create a free cluster at https://cloud.mongodb.com
- Get the connection string and use it in `MONGODB_URI`

### Security Keys
- Generate secure random strings for `JWT_SECRET` and `ENCRYPTION_KEY`
- JWT_SECRET should be at least 32 characters
- ENCRYPTION_KEY should be 64 hex characters

## 🎉 Expected Results

After successful deployment:
- **Backend URL:** `https://soulfriend-backend-production.railway.app`
- **Frontend URL:** `https://soulfriend-frontend-production.railway.app`
- **Full-stack application** running on Railway
- **Auto-deploy** from GitHub on every push

## 🔧 Troubleshooting

### Common Issues:
1. **Build fails:** Check Railway logs for errors
2. **CORS errors:** Verify `REACT_APP_API_URL` is correct
3. **Database connection:** Check `MONGODB_URI` format
4. **Environment variables:** Ensure all required vars are set

### Useful Commands:
```bash
# Check Railway status
railway status

# View logs
railway logs --follow

# Open dashboard
railway open
```

## 💰 Cost Estimate
- **Free tier:** $5 credit/month
- **Backend:** ~$2-3/month
- **Frontend:** ~$1-2/month
- **Total:** ~$3-5/month (within free tier!)

---

**Ready to deploy! Follow the steps above to get your SoulFriend application live on Railway! 🚀**
