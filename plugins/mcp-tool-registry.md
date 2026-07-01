# MCP / Tool Registry Starter

| Tool | Mode | Allowed actions | Approval required | Notes |
|---|---|---|---|---|
| filesystem | dev | read/write repo files | no | no secrets |
| shell | dev | test/build/lint only | risky commands require approval | command allowlist |
| github | dev/prod | issue/branch/PR | merge requires human | protected branches |
| jira | dev/prod | read/create/update tickets | workflow changes require approval | audit ticket links |
| postgres | dev/sandbox | schema/read/test writes | prod writes prohibited | RLS enforced |
| sap-api-catalog | dev | read docs/metadata | no | no credentials |
| oracle-api-catalog | dev | read docs/metadata | no | no credentials |
| playwright | dev/ci | UI tests | no | no live ERP writes |
| openapi-validator | ci | validate contracts | no | blocking gate |
| security-scanner | ci | scan deps/secrets | no | blocking gate |
