param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("lint", "test", "build")]
  [string]$Task,

  [ValidateSet("all", "frontend", "backend")]
  [string]$Scope = "all"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repoRoot "ResourciaFrontend"
$frontendSrc = Join-Path $frontendPath "src"
$backendSln = Join-Path $repoRoot "ResourciaBackend\src\Resourcia.sln"
$backendRoot = Join-Path $repoRoot "ResourciaBackend"

function Invoke-FrontendLint {
  if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend not found, skipping lint."
    return
  }
  Push-Location $frontendPath
  try {
    npm run lint
  }
  finally {
    Pop-Location
  }
}

function Invoke-BackendLint {
  if (-not (Test-Path $backendSln)) {
    Write-Host "Backend solution not found, skipping lint."
    return
  }
  dotnet build $backendSln -c Release
}

function Invoke-FrontendTest {
  if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend not found, skipping tests."
    return
  }
  $specFiles = Get-ChildItem -Path $frontendSrc -Recurse -File -Filter *.spec.ts -ErrorAction SilentlyContinue
  if (-not $specFiles) {
    Write-Host "No frontend spec files found, skipping tests."
    return
  }
  Push-Location $frontendPath
  try {
    npm run test -- --watch=false --browsers=ChromeHeadless
  }
  finally {
    Pop-Location
  }
}

function Invoke-BackendTest {
  if (-not (Test-Path $backendRoot)) {
    Write-Host "Backend not found, skipping tests."
    return
  }
  $testProjects = Get-ChildItem -Path $backendRoot -Recurse -File -Filter *Test*.csproj -ErrorAction SilentlyContinue
  if (-not $testProjects) {
    Write-Host "No backend test projects found, skipping tests."
    return
  }
  dotnet test $backendSln -c Release
}

function Invoke-FrontendBuild {
  if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend not found, skipping build."
    return
  }
  Push-Location $frontendPath
  try {
    npm run build -- --configuration development
  }
  finally {
    Pop-Location
  }
}

function Invoke-BackendBuild {
  if (-not (Test-Path $backendSln)) {
    Write-Host "Backend solution not found, skipping build."
    return
  }
  dotnet build $backendSln -c Release
}

switch ($Task) {
  "lint" {
    if ($Scope -in @("all", "frontend")) { Invoke-FrontendLint }
    if ($Scope -in @("all", "backend")) { Invoke-BackendLint }
  }
  "test" {
    if ($Scope -in @("all", "frontend")) { Invoke-FrontendTest }
    if ($Scope -in @("all", "backend")) { Invoke-BackendTest }
  }
  "build" {
    if ($Scope -in @("all", "frontend")) { Invoke-FrontendBuild }
    if ($Scope -in @("all", "backend")) { Invoke-BackendBuild }
  }
  default {
    throw "Unknown task: $Task"
  }
}
