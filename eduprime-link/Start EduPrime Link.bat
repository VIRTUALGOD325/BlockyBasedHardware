@echo off
REM ═══════════════════════════════════════════════
REM   EduPrime Link — Double-click to start!
REM ═══════════════════════════════════════════════
title EduPrime Link
cd /d "%~dp0"
echo.
echo  ⚡ Starting EduPrime Link...
echo.

REM ───────────────────────────────────────────────
REM  FAILSAFE: Check for internet connectivity before attempting download
REM ───────────────────────────────────────────────
:checkconnection
ping -n 1 nodejs.org >nul 2>nul
if %errorlevel% neq 0 (
    echo  ⚠️  No internet connection detected.
    echo.
    echo     An internet connection is required to install Node.js.
    echo     Please connect to the internet, then choose an option:
    echo.
    echo     [R] Retry connection
    echo     [M] I will install Node.js manually (https://nodejs.org)
    echo     [X] Exit
    echo.
    choice /c RMX /n /m "     Your choice: "
    if errorlevel 3 exit /b 1
    if errorlevel 2 goto :manualinstall
    if errorlevel 1 goto :checkconnection
)

REM ───────────────────────────────────────────────
REM  FAILSAFE: Check admin rights (needed for MSI install)
REM ───────────────────────────────────────────────
net session >nul 2>nul
set "IS_ADMIN=%errorlevel%"

REM ───────────────────────────────────────────────
REM  Check for Node.js — install if missing or outdated
REM ───────────────────────────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ⚠️  Node.js not found. Installing automatically...
    echo.
    goto :installnode
)

REM Node exists — check version is >= 16
for /f "tokens=2 delims=v." %%A in ('node -v 2^>nul') do set "NODE_MAJOR=%%A"

REM FAILSAFE: version string could not be parsed
if not defined NODE_MAJOR (
    echo  ⚠️  Could not determine Node.js version. Reinstalling to be safe...
    echo.
    goto :installnode
)

if %NODE_MAJOR% LSS 16 (
    echo  ⚠️  Node.js v%NODE_MAJOR% is installed but EduPrime Link requires v16 or higher.
    echo      Upgrading automatically...
    echo.
    goto :installnode
)

echo  ✅ Node.js v%NODE_MAJOR% detected — meets the minimum requirement (v16+^).
echo.
goto :dependencies

REM ───────────────────────────────────────────────
:installnode
REM ───────────────────────────────────────────────

REM FAILSAFE: Warn if not admin — MSI install may fail silently
if %IS_ADMIN% neq 0 (
    echo  ⚠️  WARNING: This script is not running as Administrator.
    echo      Node.js installation may fail without admin rights.
    echo.
    echo     [R] Re-launch as Administrator (recommended^)
    echo     [C] Continue anyway
    echo     [M] I will install Node.js manually (https://nodejs.org^)
    echo     [X] Exit
    echo.
    choice /c RCMX /n /m "     Your choice: "
    if errorlevel 4 exit /b 1
    if errorlevel 3 goto :manualinstall
    if errorlevel 2 goto :download
    if errorlevel 1 (
        echo.
        echo  🔄 Relaunching as Administrator...
        powershell -Command "Start-Process '%~f0' -Verb RunAs"
        exit /b 0
    )
)

:download
echo  📥 Downloading Node.js v20 LTS — please wait...
echo.

REM FAILSAFE: Clean up any previous failed download
if exist "%TEMP%\node_installer.msi" del /f /q "%TEMP%\node_installer.msi"

REM Try downloading with PowerShell
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi' -OutFile '%TEMP%\node_installer.msi'" >nul 2>nul

REM FAILSAFE: If PowerShell download failed, try with certutil (built-in fallback)
if not exist "%TEMP%\node_installer.msi" (
    echo  ⚠️  PowerShell download failed. Trying alternative method...
    certutil -urlcache -split -f "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi" "%TEMP%\node_installer.msi" >nul 2>nul
)

REM FAILSAFE: Both download methods failed
if not exist "%TEMP%\node_installer.msi" (
    echo  ❌ Download failed using all available methods.
    echo.
    goto :manualinstall
)

REM FAILSAFE: Verify the downloaded file is not 0 bytes (corrupt/partial download)
for %%F in ("%TEMP%\node_installer.msi") do set "FILE_SIZE=%%~zF"
if %FILE_SIZE% LSS 1000000 (
    echo  ❌ Downloaded file appears corrupt or incomplete.
    echo      (File size: %FILE_SIZE% bytes — expected ~30MB^)
    del /f /q "%TEMP%\node_installer.msi"
    echo.
    goto :manualinstall
)

echo  📦 Download complete. Running Node.js installer...
echo      (A UAC prompt may appear — please click Yes to continue^)
echo.

msiexec /i "%TEMP%\node_installer.msi" /quiet /norestart ADDLOCAL=ALL
set "MSI_EXIT=%errorlevel%"

REM FAILSAFE: Check MSI exit code
if %MSI_EXIT% neq 0 (
    echo  ❌ Installer exited with error code: %MSI_EXIT%
    echo.
    if %MSI_EXIT%==1602 echo      Reason: Installation was cancelled by the user.
    if %MSI_EXIT%==1603 echo      Reason: Installation failed — try running as Administrator.
    if %MSI_EXIT%==1618 echo      Reason: Another installation is already in progress.
    if %MSI_EXIT%==1638 echo      Reason: A newer version of Node.js is already installed.
    echo.
    goto :manualinstall
)

REM Clean up installer
del /f /q "%TEMP%\node_installer.msi" >nul 2>nul

REM Refresh PATH in current session without needing a restart
for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SYS_PATH=%%B"
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USR_PATH=%%B"
set "PATH=%SYS_PATH%;%USR_PATH%"

REM FAILSAFE: Verify node is now accessible after PATH refresh
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ⚠️  Node.js was installed but could not be found on PATH yet.
    echo      This can happen on some systems. Please close this window
    echo      and double-click EduPrime Link again to start normally.
    echo.
    pause
    exit /b 0
)

REM FAILSAFE: Confirm installed version now meets requirement
for /f "tokens=2 delims=v." %%A in ('node -v 2^>nul') do set "NODE_MAJOR=%%A"
if %NODE_MAJOR% LSS 16 (
    echo  ❌ Installed Node.js version still does not meet the v16+ requirement.
    echo      Please install Node.js v20 LTS manually from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js v%NODE_MAJOR% installed and verified successfully!
echo.
goto :dependencies

REM ───────────────────────────────────────────────
:manualinstall
REM ───────────────────────────────────────────────
echo  ───────────────────────────────────────────
echo   Manual Installation Instructions
echo  ───────────────────────────────────────────
echo   1. Open your browser and go to: https://nodejs.org
echo   2. Download the LTS version (v20 recommended^)
echo   3. Run the installer and follow the on-screen steps
echo   4. Make sure "Add to PATH" is ticked during install
echo   5. Close this window and double-click EduPrime Link again
echo  ───────────────────────────────────────────
echo.
pause
exit /b 1

REM ───────────────────────────────────────────────
:dependencies
REM ───────────────────────────────────────────────
if not exist "node_modules" (
    echo  📦 Installing dependencies (first time only^)...
    call npm install --omit=dev
    echo.
)

REM ───────────────────────────────────────────────
REM  FAILSAFE: Check port 8990 is not already in use
REM ───────────────────────────────────────────────
netstat -ano | findstr ":8990 " >nul 2>nul
if %errorlevel% equ 0 (
    echo  ⚠️  WARNING: Port 8990 is already in use.
    echo      EduPrime Link may already be running, or another app is using this port.
    echo.
    echo     [C] Continue anyway
    echo     [X] Exit
    echo.
    choice /c CX /n /m "     Your choice: "
    if errorlevel 2 exit /b 1
)

echo  🚀 EduPrime Link is starting on http://localhost:8990
echo     Keep this window open while using EduPrime Hardware IDE
echo.
echo     Close this window or press Ctrl+C to stop.
echo  ═══════════════════════════════════════════════════
echo.
node server.js
pause