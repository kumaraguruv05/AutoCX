@echo off
title AutoCX Launcher
echo ========================================================
echo               AutoCX - Auto ChronAx Launcher
echo ========================================================
echo.

echo [1/2] Starting AutoCX FastAPI Backend (Port 8000)...
start "AutoCX Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\activate && uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting AutoCX Vite React Frontend (Port 5173)...
start "AutoCX Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo.
echo AutoCX is now running!
echo - Frontend Interface:  http://localhost:5173/
echo - Backend API Swagger: http://127.0.0.1:8000/docs
echo.
pause
