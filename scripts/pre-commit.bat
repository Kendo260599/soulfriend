@echo off
REM Root-level pre-commit script (Windows)
REM Usage: scripts\pre-commit.bat

echo Running TypeScript type-check...

echo Checking backend...
cd backend
call npm run type-check
if %ERRORLEVEL% neq 0 (
    echo Backend type-check failed. Please fix errors before committing.
    cd ..
    exit /b 1
)
cd ..

echo Checking frontend...
cd frontend
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo Frontend type-check failed. Please fix errors before committing.
    cd ..
    exit /b 1
)
cd ..

echo All type-checks passed!
