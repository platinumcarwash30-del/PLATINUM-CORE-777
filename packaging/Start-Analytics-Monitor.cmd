@echo off
setlocal
cd /d "%~dp0"

set "NODE_ENV=production"
set "PORT=3000"
set "ADMIN_USERNAME=marko"
set "ADMIN_SESSION_SECRET=PC777-local-session-secret-20260922-keep-local-only"
set "ADMIN_PASSWORD_STORE_PATH=%~dp0data\.pc777-admin.json"
set "NOTIFICATION_TO=platinum303030@gmail.com"
set "GOOGLE_ANALYTICS_PROPERTY_ID=554126635"
set "GOOGLE_SERVICE_ACCOUNT_JSON_PATH=E:\PLATINUM_CORE_777_WORK\secrets\pc777-search-monitor.json"

if not exist "%~dp0node.exe" (
  echo Missing node.exe. Please use the complete portable ZIP.
  pause
  exit /b 1
)
if not exist "%~dp0dist\src\index.js" (
  echo Missing dist\src\index.js. Please use the complete portable ZIP.
  pause
  exit /b 1
)

if not exist "%~dp0data" mkdir "%~dp0data"

start "PLATINUM CORE 777 Analytics Monitor" "%~dp0node.exe" "%~dp0dist\src\index.js"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:3000/analytics-monitor"

echo.
echo Analytics Monitor is running at http://127.0.0.1:3000/analytics-monitor
echo First start: enter the new private password twice in the browser.
echo Keep this window open while using the monitor.
pause
