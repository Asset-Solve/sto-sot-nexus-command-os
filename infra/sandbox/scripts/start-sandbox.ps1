[CmdletBinding()]
param(
  [switch]$Vm,
  [string]$EnvFile = "",
  [switch]$Build
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sandboxRoot = Resolve-Path (Join-Path $scriptRoot "..")
$composeFile = Join-Path $sandboxRoot "docker-compose.yml"

if ($EnvFile -eq "") {
  $candidate = Join-Path $sandboxRoot ".env"
  if (Test-Path $candidate) {
    $EnvFile = $candidate
  } else {
    $EnvFile = Join-Path $sandboxRoot ".env.example"
  }
}

if ($Vm) {
  Push-Location $sandboxRoot
  try {
    vagrant up
  } finally {
    Pop-Location
  }
  return
}

$composeArgs = @("compose", "-f", $composeFile, "--env-file", $EnvFile, "up", "-d")
if ($Build) {
  $composeArgs += "--build"
}

docker @composeArgs
Write-Host "Sandbox started. Run infra/sandbox/scripts/validate-sandbox.ps1 to verify service health."
