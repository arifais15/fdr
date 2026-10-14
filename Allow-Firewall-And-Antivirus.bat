@echo off
:: ==================================================================================
:: GAZIPUR PALLI BIDYUT SAMITY-2 | FUND MANAGEMENT SYSTEM
:: Windows Firewall & Defender Antivirus Exclusion Setup Script
:: Developer: Ariful Islam (AGM Finance & Accounts)
:: ==================================================================================
title "Gazipur PBS-2 | Firewall & Antivirus Setup"
color 0A
cls

:: Check for Administrative Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ==================================================================================
    echo    Requesting Administrator privileges...
    echo    Please click YES on the User Account Control (UAC) prompt.
    echo ==================================================================================
    echo:
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ==================================================================================
echo                      GAZIPUR PALLI BIDYUT SAMITY-2
echo            AUTOMATED FIREWALL & WINDOWS DEFENDER EXCLUSION SETUP
echo ==================================================================================
echo:

echo [1/4] Unblocking downloaded project files...
powershell -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"
echo      - Done.

echo:
echo [2/4] Adding Windows Firewall rules for Port 5000 (Backend Server)...
powershell -Command "Remove-NetFirewallRule -DisplayName 'Fund Management System (Port 5000)' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Fund Management System (Port 5000)' -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue"
echo      - Port 5000 allowed.

echo:
echo [3/4] Adding Windows Firewall rules for Node.js Application...
powershell -Command "Remove-NetFirewallRule -DisplayName 'Fund Management System (Node.js)' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Fund Management System (Node.js)' -Direction Inbound -Program 'node.exe' -Action Allow -Profile Any -ErrorAction SilentlyContinue"
echo      - Node.exe allowed.

echo:
echo [4/4] Adding Windows Defender Exclusion for Fund Management directory...
powershell -Command "Add-MpPreference -ExclusionPath '%~dp0' -ErrorAction SilentlyContinue"
echo      - Folder '%~dp0' added to Defender Exclusion List.

echo:
echo ==================================================================================
echo [SUCCESS] Windows Firewall & Antivirus setup completed successfully!
echo           The Fund Management System will no longer be blocked by Windows.
echo ==================================================================================
echo:
pause
exit /b 0
