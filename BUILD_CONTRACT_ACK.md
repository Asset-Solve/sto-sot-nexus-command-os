# Build Contract Acknowledgement — STO/SOT Platform Build (Stage 00)

Date: 2026-07-01 · Controlling spec: uploaded `KICKOFF_PROMPT.md` (STO/SOT Enterprise Operating Platform) · Output: `build/sto-platform/`

Acknowledged and enforced in code:

- No static frontend demo; every button calls a backend domain action through one governed engine.
- No hard-coded dropdowns — all lookups via connector-backed APIs with source metadata and dependent filtering.
- No generic SAP connector — 22 object-specific connectors with published API contracts.
- No direct SAP table writes; BDC/Datasphere/CDS/SLT read-only; master data via MDG only.
- Transactional lifecycle: validation → posting-path decision → approval + SoD → outbox (idempotency, correlation) → connector → read-back → reconciliation → immutable audit.
- Posted records: correction/reversal transactions only, never in-place edits.
- WCM/permit/isolation/startup/OT: fail closed; human authority only.
- AI: review packages with citations only; controlled actions structurally blocked; voice commands draft, never execute.
- Simulator adapters share the exact sandbox/live contract; mode switch requires no UI rewrite.

Assumptions register: single primary tenant (t1) with second tenant for isolation proof; SIMULATOR source mode; in-process repository with documented PostgreSQL/RLS seam; persona switcher stands in for XSUAA/IAS session; deterministic agent analysis pending hosted-model enablement.

Evidence: `docs/release/LOCAL_VALIDATION_AND_REMEDIATION_REPORT.md`, `tests/governance.test.ts`, docs set under `docs/`.
