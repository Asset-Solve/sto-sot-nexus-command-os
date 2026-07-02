[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

$checks = @(
  @{ Name = "winget"; Command = "winget"; Args = @("--version") },
  @{ Name = "wsl"; Command = "wsl.exe"; Args = @("--status") },
  @{ Name = "docker"; Command = "docker.exe"; Args = @("--version") },
  @{ Name = "docker compose"; Command = "docker.exe"; Args = @("compose", "version") },
  @{ Name = "vagrant"; Command = "vagrant.exe"; Args = @("--version") }
)

$failed = @()
foreach ($check in $checks) {
  $cmd = Get-Command $check.Command -ErrorAction SilentlyContinue
  if ($null -eq $cmd) {
    Write-Host "[fail] $($check.Name) is not on PATH"
    $failed += $check.Name
    continue
  }

  try {
    $output = & $cmd.Source @($check.Args) 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[fail] $($check.Name) returned exit code $LASTEXITCODE"
      $output | Out-Host
      $failed += $check.Name
    } else {
      Write-Host "[pass] $($check.Name)"
      $output | Select-Object -First 3 | Out-Host
    }
  } catch {
    Write-Host "[fail] $($check.Name): $($_.Exception.Message)"
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  throw "Prerequisite validation failed: $($failed -join ', ')"
}

Write-Host "[pass] Sandbox prerequisites are installed."
