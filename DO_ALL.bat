@echo off
REM ============================================================
REM  DO ALL — Local app + Internet + GitHub + Supabase + Render + Vercel
REM ============================================================
setlocal EnableExtensions
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;%PATH%"
call "%~dp0scripts\env-path.bat"
cd /d "%~dp0"

title ProjectHub - DO ALL
color 0A
cls

echo.
echo  ============================================================
echo   DO ALL - Hormuud ProjectHub
echo  ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js from nodejs.org
  pause
  exit /b 1
)

echo [1/7] Building app...
if not exist "dist\index.html" call npm.cmd run build

echo [2/7] Starting ProjectHub locally on port 8080...
node scripts\stop-services.mjs 8080 3004 5180 2>nul
start "ProjectHub Server" cmd /k "cd /d "%~dp0" && call scripts\env-path.bat && set NODE_ENV=production&& set SERVE_STATIC=true&& set PUBLIC_DEPLOY=true&& set PORT=8080&& node server\src\index.js"
node scripts\wait-url.mjs "http://127.0.0.1:8080/api/health" 90
if errorlevel 1 echo WARNING: Local server slow to start - check SQL Server.

echo [3/7] Opening public internet tunnel...
start "ProjectHub Tunnel" cmd /k "cd /d "%~dp0" && node scripts\share-internet.mjs"

echo [4/7] GitHub login + push...
gh auth status >nul 2>&1
if errorlevel 1 (
  echo GITHUB: Browser opens - enter the code shown.
  start "" "https://github.com/login/device"
  gh auth login --web --git-protocol https --hostname github.com
)

echo [5/7] Pushing latest code to GitHub...
git push origin main 2>nul
if errorlevel 1 (
  gh repo create hormuud-projecthub --public --source=. --remote=origin --push 2>nul
  if errorlevel 1 git push -u origin main 2>nul
)

echo [6/7] Cloud deploy - Supabase + Render + Vercel...
node scripts\deploy-cloud-full.mjs

echo [7/7] Opening local app...
start "" "http://localhost:8080/"

echo.
echo  ============================================================
echo   DO ALL - STATUS
echo  ============================================================
echo   LOCAL:    http://localhost:8080/
echo   TUNNEL:   see ProjectHub Tunnel window for public link
echo   GITHUB:   https://github.com/ABDIRIZAKNORDAHIR/hormuud-projecthub
echo.
echo   FINISH IN BROWSER tabs opened:
echo     1. Supabase  - create DB, paste DATABASE_URL in RENDER_ENV_COPY.txt
echo     2. Render    - Blueprint, paste env vars, wait LIVE
echo     3. Vercel    - import repo, add RENDER_API_URL, deploy
echo  ============================================================
echo.
pause
