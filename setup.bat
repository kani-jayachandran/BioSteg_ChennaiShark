@echo off
echo ========================================
echo VaultX Kiro - Setup Script
echo ========================================
echo.

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    exit /b %errorlevel%
)

echo.
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    exit /b %errorlevel%
)

echo.
echo Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Copy server/.env.example to server/.env
echo 3. Update server/.env with your configuration
echo 4. Run: npm run dev
echo.
pause
