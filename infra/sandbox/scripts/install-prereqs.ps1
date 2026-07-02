[CmdletBinding()]
param(
  [switch]$InstallVirtualBox,
  [switch]$SkipSelfElevate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal] $identity
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-WingetInstall {
  param(
    [string]$Id,
    [string]$Name
  )

  Write-Host "Checking $Name..."
  $listOutput = & winget list --id $Id --exact --accept-source-agreements 2>$null
  if ($LASTEXITCODE -eq 0 -and ($listOutput -match [regex]::Escape($Id))) {
    Write-Host "$Name is already installed."
    return
  }

  Write-Host "Installing $Name..."
  & winget install --id $Id --exact --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "winget install failed for $Name ($Id) with exit code $LASTEXITCODE."
  }
}

function Enable-OptionalFeatureIfPresent {
  param(
    [string]$FeatureName
  )

  $feature = Get-WindowsOptionalFeature -Online -FeatureName $FeatureName
  if ($feature.State -eq "Enabled") {
    Write-Host "$FeatureName is already enabled."
    return
  }

  Write-Host "Enabling $FeatureName..."
  Enable-WindowsOptionalFeature -Online -FeatureName $FeatureName -All -NoRestart | Out-Null
}

function Test-RebootPending {
  $paths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired",
    "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager"
  )

  if (Test-Path $paths[0]) { return $true }
  if (Test-Path $paths[1]) { return $true }
  if (Test-Path $paths[2]) {
    $session = Get-ItemProperty $paths[2]
    if ($null -ne $session.PendingFileRenameOperations) { return $true }
  }
  return $false
}

if (-not (Test-IsAdministrator)) {
  if ($SkipSelfElevate) {
    throw "Administrator privileges are required to enable WSL, VM platform, Hyper-V, Docker Desktop, and Vagrant prerequisites."
  }

  Write-Host "Requesting administrator privileges for sandbox prerequisite installation..."
  $argList = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$PSCommandPath`"",
    "-SkipSelfElevate"
  )
  if ($InstallVirtualBox) {
    $argList += "-InstallVirtualBox"
  }
  Start-Process -FilePath "powershell.exe" -ArgumentList $argList -Verb RunAs -Wait
  exit $LASTEXITCODE
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw "winget is required. Install App Installer from Microsoft Store or add winget to PATH."
}

$scriptRoot = Split-Path -Parent $PSCommandPath
$logRoot = Join-Path (Split-Path -Parent $scriptRoot) "logs"
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$transcriptPath = Join-Path $logRoot "prereq-install-latest.log"
Start-Transcript -Path $transcriptPath -Force | Out-Null
Write-Host "Writing install transcript to $transcriptPath"

winget source update | Out-Host

Enable-OptionalFeatureIfPresent "Microsoft-Windows-Subsystem-Linux"
Enable-OptionalFeatureIfPresent "VirtualMachinePlatform"
Enable-OptionalFeatureIfPresent "Microsoft-Hyper-V-All"
Enable-OptionalFeatureIfPresent "Containers"

Invoke-WingetInstall -Id "Microsoft.WSL" -Name "Windows Subsystem for Linux"
Invoke-WingetInstall -Id "Canonical.Ubuntu.2404" -Name "Ubuntu 24.04 LTS"
Invoke-WingetInstall -Id "Docker.DockerDesktop" -Name "Docker Desktop"
Invoke-WingetInstall -Id "Hashicorp.Vagrant" -Name "HashiCorp Vagrant"

if ($InstallVirtualBox) {
  Invoke-WingetInstall -Id "Oracle.VirtualBox" -Name "Oracle VirtualBox"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = "$machinePath;$userPath"

try {
  & wsl.exe --set-default-version 2
} catch {
  Write-Host "WSL default version could not be set yet. This can happen before the required reboot."
}

Write-Host ""
Write-Host "Installed tool versions visible to this shell:"
foreach ($command in @("wsl.exe", "docker.exe", "vagrant.exe")) {
  $cmd = Get-Command $command -ErrorAction SilentlyContinue
  if ($null -eq $cmd) {
    Write-Host ("{0}: not visible until PATH refresh or reboot" -f $command)
  } else {
    if ($command -eq "wsl.exe") {
      & $cmd.Source --status
    } else {
      & $cmd.Source --version
    }
  }
}

if (Test-RebootPending) {
  Write-Host ""
  Write-Host "REBOOT_REQUIRED=true"
  Write-Host "Restart Windows, then run infra/sandbox/scripts/validate-prereqs.ps1."
} else {
  Write-Host ""
  Write-Host "REBOOT_REQUIRED=false"
  Write-Host "Run infra/sandbox/scripts/validate-prereqs.ps1, then infra/sandbox/scripts/start-sandbox.ps1."
}

Stop-Transcript | Out-Null
