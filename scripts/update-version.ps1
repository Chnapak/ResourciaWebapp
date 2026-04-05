param(
  [Parameter(Mandatory = $true)]
  [string]$Version
)

$ErrorActionPreference = "Stop"

if ($Version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z\.-]+)?(\+[0-9A-Za-z\.-]+)?$') {
  throw "Version '$Version' is not valid SemVer (expected X.Y.Z)."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$versionFile = Join-Path $repoRoot "VERSION"

Set-Content -Path $versionFile -Value $Version
Write-Host "Updated VERSION -> $Version"
