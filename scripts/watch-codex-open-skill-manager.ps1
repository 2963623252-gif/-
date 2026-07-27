$ErrorActionPreference = 'SilentlyContinue'

$ProjectRoot = 'C:\Users\29636\Documents\Codex\2026-07-23\hu\skill-manager'
$LaunchCooldownSeconds = 20
$lastLaunch = [datetime]::MinValue
$launchedForCurrentCodexSession = $false

Write-Host 'skill管理器监听器已启动：检测到 Codex/ChatGPT 后会自动打开 skill管理器。'
Write-Host '关闭此 PowerShell 窗口即可停止监听。'

while ($true) {
  $codexProcess = Get-Process | Where-Object {
    $_.ProcessName -match 'Codex|ChatGPT' -or $_.MainWindowTitle -match 'Codex|ChatGPT'
  } | Select-Object -First 1

  $managerProcess = Get-CimInstance Win32_Process -Filter "Name = 'electron.exe'" | Where-Object {
    $_.CommandLine -like '*skill-manager*'
  } | Select-Object -First 1

  if ($codexProcess -and -not $managerProcess -and -not $launchedForCurrentCodexSession) {
    $now = Get-Date
    if (($now - $lastLaunch).TotalSeconds -ge $LaunchCooldownSeconds) {
      Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory $ProjectRoot -WindowStyle Hidden
      $lastLaunch = $now
      $launchedForCurrentCodexSession = $true
      Write-Host "已自动打开 skill管理器：$now"
    }
  }

  if (-not $codexProcess) {
    $launchedForCurrentCodexSession = $false
  }

  Start-Sleep -Seconds 5
}
