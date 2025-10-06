@echo off
echo ========================================
echo    FORCE REDEPLOY - FIX ALL ERRORS
echo ========================================
echo.
cd /d "d:\ung dung\soulfriend"
powershell -ExecutionPolicy Bypass -File "FORCE_REDEPLOY_NOW.ps1"
echo.
echo Check NEW_DEPLOYMENT.txt for new URL!
echo.
pause


