[CmdletBinding()]
param(
  [switch]$Vm,
  [switch]$RemoveVolumes,
  [string]$EnvFile = ""
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
    vagrant halt
  } finally {
    Pop-Location
  }
  return
}

$composeArgs = @("compose", "-f", $composeFile, "--env-file", $EnvFile, "down")
if ($RemoveVolumes) {
  $composeArgs += "--volumes"
}

docker @composeArgs
