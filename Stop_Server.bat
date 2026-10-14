@echo off
title "Gazipur PBS-2 | Stop Fund Management Server"
color 0C
cls

echo ==================================================================================
echo                      GAZIPUR PALLI BIDYUT SAMITY-2
echo                      STOPPING FUND MANAGEMENT SERVER
echo ==================================================================================
echo:

powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo:
echo System server background processes have been stopped successfully.
echo You can safely close this window now.
echo ==================================================================================
echo:
pause
exit /b 0
