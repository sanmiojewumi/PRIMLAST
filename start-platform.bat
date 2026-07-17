@echo off
title PrimeFlow Platform Launcher
echo ==================================================
echo   PrimeFlow Digital Platform - Abuja, Nigeria
echo ==================================================
echo.
echo Launching Express backend server...
start cmd /k "title PrimeFlow API Server && cd server && npm run dev"

echo Launching Vite React frontend server...
start cmd /k "title PrimeFlow Client Server && cd client && npm run dev"

echo.
echo ==================================================
echo   Servers are launching in separate windows!
echo   API Server will run on: http://localhost:5000
echo   Client Portal will run on: http://localhost:5173
echo ==================================================
pause
