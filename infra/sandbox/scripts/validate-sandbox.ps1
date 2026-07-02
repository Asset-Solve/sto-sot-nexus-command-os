[CmdletBinding()]
param(
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

function Get-EnvValue {
  param(
    [string]$Name,
    [string]$DefaultValue
  )
  $line = Get-Content $EnvFile | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if ($null -eq $line) {
    return $DefaultValue
  }
  return ($line -split "=", 2)[1]
}

function Test-HttpEndpoint {
  param(
    [string]$Name,
    [string]$Url
  )
  try {
    $response = Invoke-RestMethod -Uri $Url -TimeoutSec 10
    Write-Host "[pass] $Name $Url"
    return $response
  } catch {
    Write-Host "[fail] $Name $Url - $($_.Exception.Message)"
    throw
  }
}

docker compose -f $composeFile --env-file $EnvFile config --quiet

$sapPort = Get-EnvValue "SANDBOX_SAP_S4_PORT" "18081"
$oraclePort = Get-EnvValue "SANDBOX_ORACLE_FUSION_PORT" "18082"
$middlewarePort = Get-EnvValue "SANDBOX_MIDDLEWARE_PORT" "18083"
$nonSapPort = Get-EnvValue "SANDBOX_NON_SAP_PORT" "18084"
$keycloakPort = Get-EnvValue "SANDBOX_KEYCLOAK_PORT" "18080"

Test-HttpEndpoint "SAP S/4 simulator" "http://localhost:$sapPort/sap/health" | Out-Null
Test-HttpEndpoint "Oracle Fusion simulator" "http://localhost:$oraclePort/oracle/health" | Out-Null
Test-HttpEndpoint "SAP Integration Suite simulator" "http://localhost:$middlewarePort/sap-is/health" | Out-Null
Test-HttpEndpoint "Oracle Integration Cloud simulator" "http://localhost:$middlewarePort/oic/health" | Out-Null
Test-HttpEndpoint "Maximo simulator" "http://localhost:$nonSapPort/maximo/health" | Out-Null
Test-HttpEndpoint "ServiceNow simulator" "http://localhost:$nonSapPort/servicenow/health" | Out-Null
Test-HttpEndpoint "PI Web API simulator" "http://localhost:$nonSapPort/piwebapi/system" | Out-Null
Test-HttpEndpoint "OPC UA bridge simulator" "http://localhost:$nonSapPort/opcua/health" | Out-Null
Test-HttpEndpoint "Keycloak realm" "http://localhost:$keycloakPort/realms/erp-sandbox/.well-known/openid-configuration" | Out-Null

$db = Get-EnvValue "SANDBOX_POSTGRES_DB" "erp_sandbox"
$user = Get-EnvValue "SANDBOX_POSTGRES_USER" "erp_sandbox"
$query = "select count(*) from erp_sandbox.integration_test_case;"
docker compose -f $composeFile --env-file $EnvFile exec -T postgres psql -U $user -d $db -c $query

Write-Host "[pass] Sandbox validation complete."
