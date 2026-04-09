param(
  [string]$InputPath = ".env",
  [string]$OutputPath = ".env.rotated"
)

$ErrorActionPreference = "Stop"

function Resolve-PathFromRoot {
  param(
    [string]$Path,
    [string]$Root
  )

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return (Join-Path $Root $Path)
}

function New-RandomHex {
  param([int]$Bytes = 32)

  $buffer = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
  return ($buffer | ForEach-Object { $_.ToString("x2") }) -join ""
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$inputResolved = Resolve-PathFromRoot -Path $InputPath -Root $repoRoot

if (-not (Test-Path $inputResolved)) {
  $fallback = Join-Path $repoRoot ".env.example"
  if (Test-Path $fallback) {
    Write-Host "Input file not found. Using $fallback"
    $inputResolved = $fallback
  } else {
    throw "Input file not found: $InputPath"
  }
}

$outputResolved = Resolve-PathFromRoot -Path $OutputPath -Root $repoRoot

$secrets = @{
  POSTGRES_PASSWORD              = New-RandomHex 32
  OwnerDetailsSettings__Password = New-RandomHex 24
  JwtSettings__SecretKey         = New-RandomHex 32
  SmtpSettings__Password         = New-RandomHex 24
  CloudflareSettings__SecretKey  = New-RandomHex 32
  OAuthOptions__Google__ClientSecret   = New-RandomHex 32
  OAuthOptions__Facebook__AppSecret    = New-RandomHex 32
}

$lines = Get-Content -Path $inputResolved
$updated = foreach ($line in $lines) {
  if ($line -match "^\s*#" -or -not ($line -match "=")) {
    $line
    continue
  }

  $parts = $line -split "=", 2
  $key = $parts[0].Trim()
  $value = if ($parts.Count -gt 1) { $parts[1] } else { "" }

  if ($secrets.ContainsKey($key)) {
    $value = $secrets[$key]
  }

  if ($key -eq "ConnectionStrings__DefaultConnection" -and $secrets.ContainsKey("POSTGRES_PASSWORD")) {
    $value = [regex]::Replace(
      $value,
      "Password=([^;]*)",
      ("Password=" + $secrets["POSTGRES_PASSWORD"])
    )
  }

  "$key=$value"
}

Set-Content -Path $outputResolved -Value $updated

Write-Host "Wrote rotated secrets to $outputResolved"
Write-Host "Review and copy values into your real secret store or .env file."
