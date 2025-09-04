$backupPath = Join-Path -Path $PSScriptRoot -ChildPath "..\backups"
$fixedBackup = Get-ChildItem -Path $backupPath -Recurse -Filter "fixed_backup.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $fixedBackup) {
    Write-Host "No fixed backup file found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found fixed backup at: $($fixedBackup.FullName)"
Write-Host "File size: $($fixedBackup.Length) bytes"
Write-Host "Last modified: $($fixedBackup.LastWriteTime)"

# Show first 5 lines
Write-Host "`nFirst 5 lines:"
Get-Content -Path $fixedBackup.FullName -TotalCount 5 | ForEach-Object { Write-Host "  $_" }

# Show last 5 lines
Write-Host "`nLast 5 lines:"
$lineCount = (Get-Content -Path $fixedBackup.FullName).Count
Get-Content -Path $fixedBackup.FullName | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
