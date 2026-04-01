@echo off
echo Creating portable executable...

:: Create a temporary directory for the portable package
set TEMP_DIR=%~dp0dist\portable-temp
set OUTPUT_EXE=%~dp0dist\fun-portable.exe

:: Clean up if exists
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
if exist "%OUTPUT_EXE%" del /q "%OUTPUT_EXE%"

:: Copy the unpacked build
xcopy /E /I /Y "%~dp0dist\win-unpacked" "%TEMP_DIR%"

:: Create a launcher batch file that runs the exe from temp location
echo @echo off > "%TEMP_DIR%\run.bat"
echo start "" "fun.exe" >> "%TEMP_DIR%\run.bat"

:: Use 7z to create a self-extracting archive
:: First create a 7z archive
"%ProgramFiles%\7-Zip\7z.exe" a -t7z "%TEMP_DIR%.7z" "%TEMP_DIR%\*" -mx=9

:: Create SFX module for Windows (using a simple approach)
:: Copy 7z SFX module
copy /b "%ProgramFiles%\7-Zip\7zSD.sfx" + "%TEMP_DIR%.7z" "%OUTPUT_EXE%"

:: Clean up
rmdir /s /q "%TEMP_DIR%"
del /q "%TEMP_DIR%.7z"

echo Portable executable created at: %OUTPUT_EXE%
pause
