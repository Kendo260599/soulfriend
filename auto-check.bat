@echo off
cd /d "d:\ung dung\soulfriend"
echo ========================================
echo AUTO DEPLOYMENT CHECK
echo ========================================
echo.
node trigger-redeploy.js
echo.
echo Check complete! Result saved to deployment-result.txt
echo.
pause


