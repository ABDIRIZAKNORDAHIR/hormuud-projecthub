@echo off
REM ============================================================
REM  DEPLOY EVERYTHING — GitHub + Supabase + Render + Vercel
REM ============================================================
setlocal EnableExtensions
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;%PATH%"
cd /d "%~dp0"
call scripts\env-path.bat

title ProjectHub - Deploy Cloud NOW
color 0B
cls

echo.
echo  Deploying ProjectHub to the cloud...
echo  (Opens Supabase, Render, and Vercel in your browser)
echo.

where node >nul 2>&1 || (echo Install Node.js & pause & exit /b 1)
where gh >nul 2>&1 || (echo Install GitHub CLI: winget install GitHub.cli & pause & exit /b 1)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo GitHub login required — browser will open...
  start "" "https://github.com/login/device"
  gh auth login --hostname github.com --git-protocol https --web
)

node scripts\deploy-cloud-full.mjs
pause
