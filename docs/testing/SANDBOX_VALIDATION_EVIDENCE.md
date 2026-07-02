# Sandbox Validation Evidence

Date: 2026-07-02

## Result Summary

| Check | Result | Evidence |
| --- | --- | --- |
| Pack lint | Passed | `.venv\Scripts\python.exe tools\lint_pack.py` parsed 17 YAML and 29 JSON files with no authoring markers |
| AGENTS file enumeration | Passed | `rg --files -uu | Where-Object { $_ -notmatch '^[.]git[\\/]' }` completed successfully |
| Schema JSON parse | Passed | `Get-ChildItem schemas -Filter *.json | ForEach-Object { Get-Content -Raw $_.FullName | ConvertFrom-Json | Out-Null }` completed successfully |
| PowerShell script syntax | Passed | PowerShell parser accepted all sandbox `*.ps1` scripts |
| Prerequisite installer asset | Passed | Added and syntax-checked `infra/sandbox/scripts/install-prereqs.ps1` and `infra/sandbox/scripts/validate-prereqs.ps1` |
| Prerequisite installer runtime | Passed | Elevated run installed Microsoft WSL, Ubuntu 24.04 LTS, Docker Desktop 4.80.0, and HashiCorp Vagrant 2.4.9 |
| Prerequisite validator | Passed | `winget`, `wsl`, `docker`, `docker compose`, and `vagrant` all passed after PATH refresh |
| Docker daemon startup | Passed | `com.docker.service` and Docker Desktop started; Docker engine reported server version `29.6.1` |
| Docker Compose runtime validation | Passed | `docker compose -f infra/sandbox/docker-compose.yml --env-file infra/sandbox/.env.example config --quiet` completed successfully |
| Sandbox stack startup | Passed | `infra/sandbox/scripts/start-sandbox.ps1` pulled images, created volumes/network, and started all sandbox containers |
| Sandbox health validation | Passed | `infra/sandbox/scripts/validate-sandbox.ps1` passed all simulator and Keycloak checks; Postgres seed count returned 8 scenarios |
| Vagrant install | Passed | `vagrant --version` returned `Vagrant 2.4.9` |
| Vagrant VM startup | Not run | Optional VM wrapper was not started because Docker Desktop local sandbox validation passed through the requested command sequence |
| Shell script syntax | Not run | WSL is installed, but the sandbox was validated through the PowerShell path |

## Commands Completed

```powershell
infra/sandbox/scripts/install-prereqs.ps1
infra/sandbox/scripts/validate-prereqs.ps1
docker compose -f infra/sandbox/docker-compose.yml --env-file infra/sandbox/.env.example config --quiet
infra/sandbox/scripts/start-sandbox.ps1
infra/sandbox/scripts/validate-sandbox.ps1
```

## Runtime Checks To Run Later

Windows reported `REBOOT_REQUIRED=true` after enabling WSL and Containers. The
sandbox validated before reboot, but a restart is still recommended so Windows
fully settles the feature changes.

```powershell
infra/sandbox/scripts/validate-prereqs.ps1
infra/sandbox/scripts/start-sandbox.ps1
infra/sandbox/scripts/validate-sandbox.ps1
```

To validate the optional VM wrapper:

```powershell
Push-Location infra/sandbox
vagrant up --provider=hyperv
Pop-Location
```

## Disposition

The workstation prerequisites are installed and the Docker Desktop sandbox stack
is running. The sandbox is ready for ERP integration validation and seeded with 8
baseline scenarios.
