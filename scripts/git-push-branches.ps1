# Push current HEAD to feature-dev and release1 on origin.
# Usage:
#   powershell -File scripts/git-push-branches.ps1
#   powershell -File scripts/git-push-branches.ps1 -Message "your commit message"
param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$trackedHar = git ls-files "errors/*.har" 2>$null
if ($trackedHar) {
    Write-Host "Removing tracked HAR files from git (kept locally)..." -ForegroundColor Yellow
    git rm --cached -- $trackedHar.Split("`n") | Out-Null
}

$status = git status --porcelain
if ($status) {
    if (-not $Message) {
        throw "Working tree has changes. Pass -Message 'your commit message' or commit manually first."
    }
    Write-Host "Staging changes (respects .gitignore)..." -ForegroundColor Cyan
    git add -A
    git commit -m $Message
} elseif (-not $Message) {
    Write-Host "Nothing to commit; pushing existing HEAD." -ForegroundColor Cyan
}

$env:GIT_SSH_COMMAND = "ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=6"
$branches = @("feature-dev", "release1")

foreach ($branch in $branches) {
    Write-Host "Pushing HEAD -> origin/$branch ..." -ForegroundColor Cyan
    git push origin "HEAD:$branch"
    if ($LASTEXITCODE -ne 0) {
        throw "Push to origin/$branch failed."
    }
}

Write-Host "Pushed to origin/feature-dev and origin/release1." -ForegroundColor Green
