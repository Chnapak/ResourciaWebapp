param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("lint", "test", "build", "e2e")]
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
    npm run test -- --watch=false --browsers=ChromeHeadless --code-coverage
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
  $unitProjects = Get-ChildItem -Path $backendRoot -Recurse -File -Filter *UnitTests.csproj -ErrorAction SilentlyContinue
  $integrationProjects = Get-ChildItem -Path $backendRoot -Recurse -File -Filter *IntegrationTests.csproj -ErrorAction SilentlyContinue
  $otherTestProjects = Get-ChildItem -Path $backendRoot -Recurse -File -Filter *Test*.csproj -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notin $unitProjects.FullName -and $_.FullName -notin $integrationProjects.FullName }

  if (-not $unitProjects -and -not $integrationProjects -and -not $otherTestProjects) {
    Write-Host "No backend test projects found, skipping tests."
    return
  }

  $coverageArgs = @(
    "/p:CollectCoverage=true",
    "/p:CoverletOutputFormat=cobertura",
    "/p:Threshold=0",
    "/p:ThresholdType=line"
  )

  if ($unitProjects) {
    Write-Host "Running backend unit tests..."
    foreach ($project in $unitProjects) {
      dotnet test $project.FullName -c Release @coverageArgs
    }
  }

  if ($integrationProjects) {
    Write-Host "Running backend integration tests..."
    foreach ($project in $integrationProjects) {
      dotnet test $project.FullName -c Release @coverageArgs
    }
  }

  if ($otherTestProjects) {
    Write-Host "Running backend tests..."
    foreach ($project in $otherTestProjects) {
      dotnet test $project.FullName -c Release @coverageArgs
    }
  }
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

function Invoke-FrontendE2E {
  if (-not (Test-Path $frontendPath)) {
    Write-Host "Frontend not found, skipping e2e."
    return
  }
  Push-Location $frontendPath
  try {
    npm run test:e2e
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
  "e2e" {
    if ($Scope -in @("all", "frontend")) { Invoke-FrontendE2E }
  }
  default {
    throw "Unknown task: $Task"
  }
}
