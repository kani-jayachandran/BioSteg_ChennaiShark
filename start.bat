@echo off
echo ========================================
echo Bio_Steg - Starting Application
echo ========================================
echo.

echo Starting MongoDB (if not already running)...
start "MongoDB" mongod

timeout /t 3 /nobreak > nul

echo.
echo Starting Backend and Frontend...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.

npm run dev
