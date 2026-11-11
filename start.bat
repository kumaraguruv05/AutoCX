@echo off
setlocal
title AutoCX Launcher
echo ========================================================
echo               AutoCX - Auto ChronAx Launcher
echo ========================================================
echo.

if not exist "%~dp0backend\.venv\Scripts\python.exe" (
    echo [Setup] Creating backend Python virtual environment...
    python -m venv "%~dp0backend\.venv"
    if errorlevel 1 (
        echo [Error] Failed to create Python virtual environment. Ensure Python 3.11+ is installed.
        pause
        exit /b 1
    )
    echo [Setup] Installing backend dependencies...
    "%~dp0backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
    "%~dp0backend\.venv\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.txt"
)

if not exist "%~dp0frontend\node_modules" (
    echo [Setup] Installing frontend Node dependencies...
    pushd "%~dp0frontend"
    call npm install
    popd
)

echo [1/2] Starting AutoCX FastAPI Backend (Port 8000)...
pushd "%~dp0backend"
start "AutoCX Backend (FastAPI)" cmd /k "call .venv\Scripts\activate.bat && .venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload"
popd

echo [2/2] Starting AutoCX Vite React Frontend (Port 5173)...
pushd "%~dp0frontend"
start "AutoCX Frontend (Vite)" cmd /k "npm run dev"
popd

echo.
echo Waiting for AutoCX Backend API to load ML models...
powershell -NoProfile -Command "$i=0; while ($i -lt 25) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 600; $i++ }"

echo Opening browser...
start http://localhost:5173/

echo.
echo AutoCX is now running!
echo - Frontend Interface:  http://localhost:5173/
echo - Backend API Swagger: http://127.0.0.1:8000/docs
echo.
pause
