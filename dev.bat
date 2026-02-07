@echo off
title AI Resume Builder - Development Mode
echo =====================================================
echo       🚀 AI Resume Builder - Dev Mode
echo =====================================================
echo.

:: 1. Install Backend Dependencies
echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend npm install failed!
    pause
    exit /b 1
)
cd ..

:: 2. Install Frontend Dependencies
echo [2/4] Installing Frontend Dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend npm install failed!
    pause
    exit /b 1
)
cd ..

:: 3. Start Backend in New Window
echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

:: 4. Start Frontend in New Window
echo [4/4] Starting Frontend Dev Server...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

:: 5. Wait and Open Browser
timeout /t 3 /nobreak >nul
echo.
echo ✅ Development servers starting...
echo    - Backend:  http://localhost:8000
echo    - Frontend: http://localhost:5173
echo.
echo Opening browser in 2 seconds...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo 🎉 Dev environment is running!
echo    Press any key to exit this window (servers will keep running)
pause >nul
