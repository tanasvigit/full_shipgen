# Forward phone localhost ports to your PC (USB debugging).
$ErrorActionPreference = "Stop"

$lines = adb devices | Where-Object { $_ -match "\t" }
$authorized = $lines | Where-Object { $_ -match "`tdevice$" }
$unauthorized = $lines | Where-Object { $_ -match "`tunauthorized$" }

if ($unauthorized -and -not $authorized) {
    Write-Error @"
Android device is connected but not authorized.

On your phone:
  1. Unlock the screen
  2. Tap Allow on the USB debugging prompt (check Always allow)
  3. Re-run: npm run run-android:usb

If no prompt appears:
  adb kill-server
  adb start-server
  adb devices
"@
}

if (-not $authorized) {
    Write-Error "No Android device connected. Plug in USB, enable Developer options > USB debugging, then run 'adb devices'."
}

$ports = @(8081, 8000, 38000)
foreach ($port in $ports) {
    adb reverse "tcp:$port" "tcp:$port" | Out-Null
    Write-Host "adb reverse tcp:$port -> tcp:$port"
}

Write-Host ""
Write-Host "USB port forwarding ready. Use .env.usb (127.0.0.1) for API and Metro."
