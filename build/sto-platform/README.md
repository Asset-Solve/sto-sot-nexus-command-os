# STO/SOT Nexus Command OS

Next-generation Shutdown, Outage & Turnaround command-and-control platform built to the controlling specification in `KICKOFF_PROMPT.md` and the market-leading enhancement prompt in `../../prompts/23_market_leading_sto_sot_e2e_enhancement_prompt.md`. Command-center-first, transaction-first, clean-core SAP orchestration with fail-closed safety controls, governed AI, mobility readiness, FEL gates, e-workpacks, RTLS execution, commercial recovery, cost reconciliation, and analytics-to-action.

## Run

```bash
cd build/sto-platform
npm install
npm run dev        # http://localhost:3000  (redirects to /command-center)
npm run dev:nexus  # http://localhost:3401  (isolated enhanced duplicate)

npm audit --audit-level=moderate
npm run validate   # Next route typegen + typecheck + governance test suite + production build
```

Requires Node 20.9+ (Node 22/24 recommended for the validated runtime). Voice commands need Chrome or Edge (Web Speech API); typed commands in the top bar use the same grammar everywhere.

## What this is

- **Process-first execution (v1.1)**: a machine-readable STO process backbone (`src/server/domain/process.ts`) drives the whole UX — a 15-stage lifecycle ribbon on every screen with live open-item counts, **state-aware action triggers on every row** (only the governed actions valid for that object's current lifecycle state and your role, pre-filled from the object), a "what happens next" panel per selection, and **My Work** (`/my-work`): the persona queue of approvals waiting on you (SoD-filtered), process actions in your court, and AI review packages addressed to your role. See `docs/domain/STO_PROCESS_ACTIVITY_MAP.md`.
- **Nexus enhancement workbenches (v1.2)**: Mobility Readiness, FEL Readiness, Control of Work, RTLS Execution Map, Contract Performance, Cost Reconciliation, and Analytics & Insights. These are not decorative pages: each is backed by source-of-record objects, state-aware row actions, connector-ready data contracts, My Work triggers, and regression tests.
- **20+ transactional workbenches** (portfolio, scope, work packages, schedule, materials, permits/WCM, area risk, contractors, field execution, time/labor/CATS/payroll, QA/turnover, startup/PSSR/RTS, cost, lessons, data foundation, integration hub, resilience ops, AI workbench, admin) — every screen is a contract-driven object queue with governed actions, not a dashboard.
- **Governed transaction backbone**: every controlled action produces a canonical transaction envelope → validation → posting-path decision → four-eyes approval (SoD enforced server-side) → transactional outbox → object-specific connector → read-back → reconciliation → immutable audit. Posted records reverse via linked transactions, never in-place edits.
- **Object-specific SAP connectors** (never one generic adapter): `API_MAINTNOTIFICATION`, `API_MAINTENANCEORDER_0002`, `API_MAINTORDERCONFIRMATION`, `API_RESERVATION_DOCUMENT_SRV`, `API_PURCHASEREQUISITION_2`, `API_MATERIAL_DOCUMENT_SRV`, `API_SERVICE_ENTRY_SHEET_SRV`, `API_MANAGE_WORKFORCE_TIMESHEET` (SAP_COM_0027), Journal Entry, DMS, MDG, APM, BDC/Datasphere (read-only), SAP SSAM mobile sync, SAP FSM dispatch — plus P6, ePTW, PI historian, RTLS, Fieldglass, LMS, access/badge, OpenText/Documentum, payroll gateways, PowerPlan, ServiceNow.
- **Fail-closed safety**: WCM/ePTW permits and isolations are read-only sources of record. Any write attempt is refused by the posting-path engine and audited; field start and work-package release fail closed on suspended/expired clearance.
- **Governed AI**: 12-agent roster with deterministic model routing, cited review packages, confidence, and a policy gateway that structurally blocks AI from approving, posting, releasing, restoring, rebaselining or replaying. The AI Workbench includes a live "prove blocked action" button.
- **Voice commands**: push-to-talk (or typed) commands navigate, answer status questions from read models, and pre-fill controlled-action drafts. Voice never executes controlled actions and refuses safety/finance/startup approvals outright. Prompt-injection heuristics quarantine instruction-like transcripts.
- **Multi-tenant + RBAC/ABAC**: 33 personas, role permission verbs, plant/unit scope filters, tenant isolation on every repository read. The persona switcher in the top bar simulates the IdP session (XSUAA/Entra in production).

## Source modes

Every connector implements the same contract in `SIMULATOR | SEED_DATA | SANDBOX | LIVE | CACHE | DISABLED`. The app runs fully in SIMULATOR mode today; promoting a connector is an adapter binding + certification record, never a UI rewrite. Disabling a connector blocks writes server-side and holds outbox messages.

## Demo script (happy path)

0. **My Work** — switch personas in the top bar (try Gus Weber → Maria Diaz → Sam Okafor) and watch each role's queue change: approvals, state-driven actions with prefilled drafts, AI reviews. Say/type: **"my work"**.
1. **Command Center** — lifecycle ribbon shows the event at Daily Execution with open-item counts per stage; KPIs drill to records; approvals queue inline.
2. Say/type: **"show material shortages"** → Materials opens with MAT-4714 shortage.
3. Say/type: **"reserve 6 sets of MAT-4714"** → governed draft opens with validation, posting path, SAP payload preview (`API_RESERVATION_DOCUMENT_SRV`).
4. Complete fields, submit → transaction goes `pending_approval` (you cannot approve your own submission).
5. Switch persona to **Kate Brody (maintenance_supervisor)** → approve in Command Center → outbox dispatch → simulated SAP doc number → read-back → `reconciled`. Inspect the full lifecycle in **Resilience Ops**.
6. **Work Packages** — try releasing WP-1002: blocked (readiness gaps + suspended permit PTW-88103, fail-closed).
7. **Permits** — try "Update Permit Status": refused, WCM fails closed; use "Request Correction" instead.
8. **AI Workbench** — run the roster; open cited review packages; press "Prove blocked action".
9. **Startup/PSSR** — try approving RTS: blocked by class-A punch, PSSR %, isolation restoration.
10. **Resilience Ops** — submit a reservation with `__simulateFailure: "transient"` (or reverse a posted one), run worker ticks, watch retry → DLQ → replay-with-reason.

## Architecture

Single Next.js 16 App Router codebase with a strictly layered server (`src/server`): core (types, store, RBAC, posting-path engine, transaction engine, outbox/reconciliation, lookup) → connectors (registry + simulator adapters) → domain (action catalog) → ai (router, agents, voice). API route handlers are thin BFF delegates. The repository layer and worker functions are the production seams: swap the memory driver for PostgreSQL (RLS by tenant), move `processOutbox` into a dedicated worker, split the API into NestJS services when scale demands — no domain logic changes.

Production posture (per `prompts/19`): BTP Destination + Cloud Connector for SAP transport, XSUAA/IAS principal propagation, secrets in credential store, OpenTelemetry, CI gates running `npm run validate`.

## Local validation evidence

Validated locally on Node 24.18.0 / npm 11.16.0:

- `npm audit --audit-level=moderate` → 0 vulnerabilities.
- `npm run validate` → typecheck passed, Vitest governance suite passed (24/24), and Next.js 16 production build passed.
- Browser smoke at `http://localhost:3000/command-center` verified the command center, API bootstrap, connector-backed objects, and console error state.
- Compatibility smoke at `http://localhost:3000/integration-hub` redirects to the connector console (`/connectors`) so links from prior STO/SOT builds continue to work.
- HTTP writeback smoke verified `material.reserve` preview + submit + supervisor approval + simulated SAP reservation document + read-back reconciliation.

## Where things live

| Concern | Path |
| --- | --- |
| Canonical types / txn envelope | `src/server/core/types.ts` |
| Posting-path decision engine | `src/server/core/postingPath.ts` |
| Action execution + approvals + SoD | `src/server/core/engine.ts` |
| Outbox / retry / DLQ / replay / read-back | `src/server/core/outbox.ts` |
| Connector registry + simulator | `src/server/connectors/` |
| Domain action catalog (all buttons) | `src/server/domain/registry.ts` |
| Lookup service (all dropdowns) | `src/server/core/lookup.ts` |
| AI router / agents / voice grammar | `src/server/ai/` |
| Screen contracts | `src/lib/screens.ts` |
| Process map / state-actions / work queue | `src/server/domain/process.ts` |
| Governance test suite | `tests/governance.test.ts` |
| Process/transactional-UX tests | `tests/process.test.ts` |
| Nexus enhancement tests | `tests/market-enhancement.test.ts` |
