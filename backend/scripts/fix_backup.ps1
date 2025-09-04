# Get the most recent backup directory
$backupPath = Join-Path -Path $PSScriptRoot -ChildPath "..\backups"
$latestBackupDir = Get-ChildItem -Path $backupPath -Directory | 
    Where-Object { $_.Name -like "pgdump_*" } | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if (-not $latestBackupDir) {
    Write-Host "No backup directories found in $backupPath" -ForegroundColor Red
    exit 1
}

$inputFile = Join-Path -Path $latestBackupDir.FullName -ChildPath "backup.sql"
$outputFile = Join-Path -Path $latestBackupDir.FullName -ChildPath "fixed_backup.sql"

Write-Host "Found backup directory: $($latestBackupDir.FullName)"

if (-not (Test-Path -Path $inputFile)) {
    Write-Host "Backup file not found: $inputFile" -ForegroundColor Red
    exit 1
}

Write-Host "Processing backup file: $inputFile"

# Read the file content
$content = Get-Content -Path $inputFile -Raw

# Remove problematic DO blocks
$pattern = 'DO\s*\$[^$]*\$[^$]*\$\s*LANGUAGE\s+plpgsql\s*;'
$content = $content -replace $pattern, ''

# Add transaction handling
if (-not $content.StartsWith('BEGIN;')) {
    $content = "BEGIN;`n" + $content
}
if (-not $content.Trim().EndsWith('COMMIT;')) {
    $content = $content.Trim() + "`nCOMMIT;`n"
}

# Write the fixed content to a new file
$content | Set-Content -Path $outputFile -NoNewline

Write-Host "✅ Fixed backup created at: $outputFile" -ForegroundColor Green
