# Create portable ph.exe using PowerShell and 7-Zip
$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $PSScriptRoot "dist\win-unpacked"
$tempDir = Join-Path $PSScriptRoot "dist\ph-temp"
$outputExe = Join-Path $PSScriptRoot "dist\ph-portable.exe"
$configFile = Join-Path $PSScriptRoot "dist\config.txt"
$sfxModule = Join-Path $PSScriptRoot "7zSD.sfx"

Write-Host "========================================"
Write-Host "Creating portable ph.exe"
Write-Host "========================================"

# Clean up
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $outputExe) { Remove-Item -Force $outputExe }
if (Test-Path $configFile) { Remove-Item -Force $configFile }

# Copy files
Write-Host "Copying files..."
Copy-Item -Recurse $sourceDir $tempDir

# Create SFX config
Write-Host "Creating SFX config..."
@'
;@!@#~!!
[Settings]
Silent=1
Overwrite=1
TempMode=1
RunProgram="ph.exe"
'@ | Out-File -FilePath $configFile -Encoding ASCII -NoNewline

# Create 7z archive
Write-Host "Creating archive..."
& "C:\Program Files\7-Zip\7z.exe" a -t7z -mx=9 "$tempDir.7z" "$tempDir\*"

# Check if SFX module exists
if (-not (Test-Path $sfxModule)) {
    Write-Host "ERROR: 7zSD.sfx not found!"
    Write-Host "Please download 7-Zip extra package from https://www.7-zip.org/"
    Write-Host "and extract 7zSD.sfx to the project root."
    pause
    exit 1
}

# Combine files
Write-Host "Creating portable executable..."
$bytes1 = [System.IO.File]::ReadAllBytes($sfxModule)
$bytes2 = [System.IO.File]::ReadAllBytes($configFile)
$bytes3 = [System.IO.File]::ReadAllBytes("$tempDir.7z")

$fs = [System.IO.File]::Create($outputExe)
$fs.Write($bytes1, 0, $bytes1.Length)
$fs.Write($bytes2, 0, $bytes2.Length)
$fs.Write($bytes3, 0, $bytes3.Length)
$fs.Close()

# Clean up
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force "$tempDir.7z"
Remove-Item -Force $configFile

Write-Host "========================================"
Write-Host "Portable executable created: $outputExe"
Write-Host "========================================"
Write-Host ""
Write-Host "Note: The portable exe extracts to temp folder on each run."
Write-Host "For better performance, consider distributing the unpacked folder."
