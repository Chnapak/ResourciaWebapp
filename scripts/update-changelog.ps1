param()

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$changelogPath = Join-Path $repoRoot "CHANGELOG.md"

if (-not (Test-Path $changelogPath)) {
  @(
    "# Changelog",
    "",
    "All notable changes to this project will be documented in this file.",
    "The format is based on Keep a Changelog, and this project follows Semantic Versioning.",
    "",
    "## [Unreleased]"
  ) | Set-Content -Path $changelogPath
}

npx --yes conventional-changelog-cli -p conventionalcommits -i $changelogPath -s -r 0
if ($LASTEXITCODE -ne 0) {
  throw "Failed to generate CHANGELOG.md."
}

Write-Host "Updated CHANGELOG.md"
