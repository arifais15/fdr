@echo off
cd /d "%~dp0"
title "Gazipur PBS-2 | Fund Management System by Ariful Islam"
color 0A
cls

echo ==================================================================================
echo                      GAZIPUR PALLI BIDYUT SAMITY-2
echo            FDR, SAVINGS CERTIFICATE ^& FUND MANAGEMENT SYSTEM
echo ==================================================================================
echo:
echo    Developer   : Ariful Islam
echo    Designation : AGM (Finance ^& Accounts), Gazipur PBS-2
echo    Contact Cell: 01737530731
echo:
echo ==================================================================================
echo    Starting Express Engine ^& Database Server...
echo ==================================================================================
echo:

if not exist "%~dp0server\server.js" goto NO_SERVER

SET "NODE_CMD=node"
if exist "%~dp0node.exe" SET "NODE_CMD=%~dp0node.exe"

start "" /B "%NODE_CMD%" server/server.js

ping 127.0.0.1 -n 3 >nul 2>&1

start "" http://localhost:5000

echo:
echo ==================================================================================
echo    System is running at: http://localhost:5000
echo    Close this window or run Stop_Server.bat to stop the server.
echo ==================================================================================
echo:

pause
exit /b 0

:NO_SERVER
color 0C
echo [ERROR] server\server.js not found!
echo:
echo Please make sure you have EXTRACTED all files from the ZIP archive
echo before running Launch.bat.
echo:
echo Right-click the ZIP file -^> "Extract All..." -^> Open Launch.bat from extracted folder.
echo ==================================================================================
pause
exit /b 1
