@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Creating portable ph.exe
echo ========================================

cd /d "%~dp0"

set TEMP_DIR=%~dp0dist\ph-temp
set OUTPUT_EXE=%~dp0dist\ph-portable.exe
set CONFIG_FILE=%~dp0dist\config.txt

:: Clean up if exists
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
if exist "%OUTPUT_EXE%" del /q "%OUTPUT_EXE%"
if exist "%CONFIG_FILE%" del /q "%CONFIG_FILE%"

:: Copy the unpacked build
echo Copying files...
xcopy /E /I /Y "%~dp0dist\win-unpacked" "%TEMP_DIR%"

:: Create SFX configuration file
echo ;@!@#~!! > "%CONFIG_FILE%"
echo [Settings] >> "%CONFIG_FILE%"
echo Silent=1 >> "%CONFIG_FILE%"
echo Overwrite=1 >> "%CONFIG_FILE%"
echo TempMode=1 >> "%CONFIG_FILE%"
echo RunProgram="ph.exe" >> "%CONFIG_FILE%"

:: Create 7z archive
echo Creating archive...
"7z" a -t7z -mx=9 "%TEMP_DIR%.7z" "%TEMP_DIR%\*"

:: Download or locate SFX module
set SFX_MODULE=%~dp07zSD.sfx
if not exist "%SFX_MODULE%" (
    echo SFX module not found. Downloading...
    curl -L -o "%SFX_MODULE%" "https://raw.githubusercontent.com/7zip/7zip/master/C/7zSD.sfx" 2>nul
    if not exist "%SFX_MODULE%" (
        echo ERROR: Could not download SFX module.
        echo Please download 7zSD.sfx manually from 7-Zip SDK.
        pause
        exit /b 1
    )
)

:: Combine SFX module + config + 7z archive
echo Creating portable executable...
copy /b "%SFX_MODULE%" + "%CONFIG_FILE%" + "%TEMP_DIR%.7z" "%OUTPUT_EXE%"

:: Clean up
rmdir /s /q "%TEMP_DIR%"
del /q "%TEMP_DIR%.7z"
del /q "%CONFIG_FILE%"

echo ========================================
echo Portable executable created: %OUTPUT_EXE%
echo ========================================
pause
