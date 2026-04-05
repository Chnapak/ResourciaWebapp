param()

$ErrorActionPreference = "Stop"

function Get-StagedPaths {
  $paths = git diff --cached --name-only
  if (-not $paths) {
    return @()
  }
  return $paths -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$staged = Get-StagedPaths

if (-not $staged -or $staged.Count -eq 0) {
  Write-Host "No staged changes detected. Skipping pre-commit checks."
  exit 0
}

$needsFrontend = $staged | Where-Object { $_ -like "ResourciaFrontend/*" }
$needsBackend = $staged | Where-Object { $_ -like "ResourciaBackend/*" }

if (-not $needsFrontend -and -not $needsBackend) {
  Write-Host "No frontend or backend changes detected. Skipping pre-commit checks."
  exit 0
}

if ($needsFrontend) {
  Write-Host "Running frontend lint..."
  & (Join-Path $PSScriptRoot "ci.ps1") -Task lint -Scope frontend
}

if ($needsBackend) {
  Write-Host "Running backend lint..."
  & (Join-Path $PSScriptRoot "ci.ps1") -Task lint -Scope backend
}

Write-Host "Pre-commit checks completed."
