# Sandbox VM Runbook

This runbook defines the reusable sandbox for integration validation across ERP
use cases. It gives each build a governed place to prove connector behavior,
outbox processing, read-back, reconciliation, security, observability, and AI
guardrails before any live ERP connection is considered.

## What It Provides

| Layer | Sandbox component | Validation purpose |
| --- | --- | --- |
| VM wrapper | `infra/sandbox/Vagrantfile` | Repeatable Ubuntu host for teams that want isolation from the workstation |
| Database | Postgres 16 | Tenant data, connector routing, idempotency, outbox, target references, read-back, reconciliation, audit, AI evidence |
| Identity | Keycloak realm `erp-sandbox` | OIDC, service account, tester, approver, and viewer roles |
| Messaging | RabbitMQ | Event and DLQ behavior for async integration tests |
| Cache | Redis | Lookup cache and idempotency acceleration |
| SAP simulator | WireMock on port `18081` | S/4-style released API responses and SAP event acceptance |
| Oracle simulator | WireMock on port `18082` | Fusion REST and quarterly regression behavior |
| Middleware simulator | WireMock on port `18083` | SAP Integration Suite iFlow and OIC flow behavior |
| Non-SAP simulator | WireMock on port `18084` | Maximo, ServiceNow, PI Web API, and OPC UA bridge simulation |
| Evidence storage | MinIO | Attachments, payload previews, and evidence objects |
| Observability | OpenTelemetry Collector, Prometheus, Grafana | Traces, metrics, health, and run evidence |
| Notification sink | Mailpit | Approval, alert, and support email validation |

## Start Locally

Install the workstation prerequisites first:

```powershell
infra/sandbox/scripts/install-prereqs.ps1
```

If the installer reports `REBOOT_REQUIRED=true`, restart Windows and then run:

```powershell
infra/sandbox/scripts/validate-prereqs.ps1
```

```powershell
Copy-Item infra/sandbox/.env.example infra/sandbox/.env
infra/sandbox/scripts/start-sandbox.ps1
infra/sandbox/scripts/validate-sandbox.ps1
```

Useful endpoints:

| Service | URL |
| --- | --- |
| Keycloak | `http://localhost:18080/realms/erp-sandbox` |
| SAP S/4 simulator | `http://localhost:18081/sap/health` |
| Oracle Fusion simulator | `http://localhost:18082/oracle/health` |
| Middleware simulator | `http://localhost:18083/sap-is/health` |
| Non-SAP simulator | `http://localhost:18084/maximo/health` |
| RabbitMQ UI | `http://localhost:15672` |
| Grafana | `http://localhost:13000` |
| Prometheus | `http://localhost:19090` |
| MinIO console | `http://localhost:19001` |
| Mailpit | `http://localhost:18025` |

## Start As A VM

Install Vagrant and either VirtualBox or Hyper-V, then run:

```powershell
Push-Location infra/sandbox
vagrant up --provider=hyperv
Pop-Location
```

The VM mounts this repository at `/workspace`, installs Docker and Compose, then
starts the sandbox stack with `infra/sandbox/.env.example`. The default VM uses
4 CPUs and 8192 MB RAM. Override with `ERP_SANDBOX_CPUS` and
`ERP_SANDBOX_MEMORY_MB`.

To install VirtualBox in addition to Hyper-V, run:

```powershell
infra/sandbox/scripts/install-prereqs.ps1 -InstallVirtualBox
```

## Use In A Generated ERP App

1. Copy `infra/sandbox/config/connector-overrides.sandbox.yaml` into the app
   environment configuration.
2. Set connector mode to `SANDBOX` for integration, contract, e2e,
   reconciliation, performance, and AI eval runs.
3. Keep `LIVE` mode disabled in automated test pipelines unless a release gate
   explicitly approves live credentials and live write tests.
4. Route all frontend calls through the generated API or BFF. The frontend must
   never call simulator, ERP, database, or secrets endpoints directly.

## Guardrails

- No live ERP credentials belong in this sandbox.
- SAP is the default primary ERP and Oracle is the backup ERP; source-of-record
  routing still decides object by object.
- Dual-posting is prohibited. Automatic write failover is prohibited.
- All writes must pass payload preview, approval when controlled, outbox,
  idempotency, target reference capture, read-back, reconciliation, and audit.
- AI can draft and recommend but cannot approve or post a controlled action.
- OT and historian simulators are read-only by default.

## Reset

Stop the stack:

```powershell
infra/sandbox/scripts/stop-sandbox.ps1
```

Reset data volumes only when you want a clean sandbox:

```powershell
infra/sandbox/scripts/stop-sandbox.ps1 -RemoveVolumes
infra/sandbox/scripts/start-sandbox.ps1
```

## Exit Criteria

A use case is sandbox-ready when these are true:

- `infra/sandbox/scripts/validate-sandbox.ps1` passes.
- App tests pass in `SANDBOX` mode for integration, contract, security,
  reconciliation, e2e, performance, and AI eval suites where applicable.
- Evidence is captured in `docs/testing/VALIDATION_EVIDENCE_PACK.md`.
- Any native API gaps are resolved in the integration matrix or recorded as an
  approved fallback ADR.
