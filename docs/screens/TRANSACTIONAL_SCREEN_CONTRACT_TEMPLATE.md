# Transactional Screen Contract Template

## Screen summary

- Screen name:
- Route:
- Persona:
- Business process step:
- Screen classification:
- Primary object:
- Source of record:
- Target systems:
- Risk class:

## Field mapping

| Field | UI type | Required | Editable | Backend lookup/API | Source system | Source object | Target object | Validation | Defaulting | Write-back impact | Audit |
|---|---|---:|---:|---|---|---|---|---|---|---|---|

## Action mapping

| Action | Button | Role | Backend endpoint | Workflow transition | Target object | Connector | Payload preview | Approval | Outbox | Read-back | Reconciliation | Audit event |
|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---|

## UI rules

- Disable action if prerequisites are missing.
- Show blocking reasons.
- Show source system and connector mode.
- Show last sync and data freshness.
- Show payload preview before release.
- Show audit timeline for all controlled actions.
