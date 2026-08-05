@echo off
title USAS Class Timetable Runner
echo ===================================================
echo             USAS Class Timetable Runner
echo ===================================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in your PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules folder exists
if not exist "node_modules\" (
    echo [INFO] node_modules directory not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check the logs above.
        echo.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: Run the dev server
echo [INFO] Starting the development server...
echo.
call npm run dev

pause
