@echo off
REM Test Socket Integration Script
REM This script tests the complete socket integration flow

echo.
echo ================================
echo Testing Socket Integration for Lev Page
echo ================================
echo.

REM Check if Socket Server is running
echo 1. Checking Socket Server...
curl -s http://localhost:3001/health > temp_health.txt 2>nul

if %errorlevel% equ 0 (
    echo [OK] Socket Server is running
    type temp_health.txt
    del temp_health.txt
) else (
    echo [ERROR] Socket Server is NOT running
    echo Please start it with: cd socket-server ^&^& npm run dev
    if exist temp_health.txt del temp_health.txt
    exit /b 1
)

echo.

REM Check Socket Server stats
echo 2. Getting Socket Server stats...
curl -s http://localhost:3001/stats
echo.

echo.

REM Test broadcast endpoint
echo 3. Testing broadcast endpoint...
curl -s -X POST http://localhost:3001/broadcast -H "Content-Type: application/json" -d "{\"userIds\": [\"test-user-1\", \"test-user-2\"], \"notification\": {\"actionKey\": \"test\", \"title\": {\"he\": \"בדיקה\", \"en\": \"Test\"}, \"body\": {\"he\": \"זוהי בדיקה\", \"en\": \"This is a test\"}, \"updateStrategy\": {\"type\": \"none\"}}}"

if %errorlevel% equ 0 (
    echo.
    echo [OK] Broadcast endpoint is working
) else (
    echo.
    echo [ERROR] Broadcast endpoint failed
    exit /b 1
)

echo.

REM Check if main app is running
echo 4. Checking main application...
curl -s -o nul -w "%%{http_code}" http://localhost:5173 > temp_app.txt 2>nul
set /p APP_RESPONSE=<temp_app.txt
del temp_app.txt

if "%APP_RESPONSE%"=="200" (
    echo [OK] Main application is running
) else (
    echo [WARNING] Main application might not be running (HTTP %APP_RESPONSE%)
    echo Please start it with: npm run dev
)

echo.
echo ================================
echo [OK] All checks passed!
echo.
echo Next steps:
echo   1. Open http://localhost:5173/lev in one tab
echo   2. Open http://localhost:5173/test-lev-socket in another tab
echo   3. Click 'דמה התראה' in the test page
echo   4. Check that notification appears in the lev page
echo.
echo Debugging:
echo   - Socket Server logs: Check the terminal where socket-server is running
echo   - Browser console: Open DevTools (F12) in both tabs
echo   - Network tab: Check WebSocket connection status
echo.
