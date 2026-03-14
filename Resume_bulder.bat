@echo off
title AI Resume Builder
echo =====================================================
echo       🚀 Starting AI Resume Builder...
echo =====================================================

:: 1. Build Frontend if missing
if exist "frontend\dist\index.html" goto :SKIP_BUILD

echo [INFO] Building Frontend (First Time Only)...
cd frontend
call npm install
call npm run build
cd ..

:SKIP_BUILD

:: 2. Open Browser
echo [INFO] Opening Browser...
start http://localhost:8000

:: 3. Start Server
echo [INFO] Starting Backend Server...
cd backend
node server.js

:: 4. Pause on exit so user can see errors
echo.
echo [INFO] Server stopped.
pause
