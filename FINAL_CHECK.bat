@echo off
title SoulFriend Deployment Check
color 0A
cd /d "d:\ung dung\soulfriend"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     🚀 SOULFRIEND DEPLOYMENT AUTO CHECK 🚀            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📊 Checking deployment status...
echo.
node trigger-redeploy.js

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 📋 Result saved to: deployment-result.txt
echo.
echo 🌐 Next steps:
echo    1. Check the URL shown above
echo    2. Open in browser
echo    3. Press F12 for Console
echo    4. Test chatbot
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause


