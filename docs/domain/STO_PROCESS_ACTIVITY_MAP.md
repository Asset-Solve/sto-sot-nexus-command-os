# STO Process & Activity Map — How Screens Execute Day-to-Day Work

This document answers the core operating question: **where does each data object fit in the turnaround process, and what does each persona do with it, on which screen, to move the event forward?** It is the design record for the v1.1 "transactional, not dashboard" enhancement.

Machine-readable source of truth: `build/sto-platform/src/server/domain/process.ts` — the UI (process ribbon, row-level action triggers, "what happens next" panel, My Work queue) renders directly from it, so this document and the application cannot drift apart.

## Methodology: from process flow to screen triggers

1. **Process decomposition** — KICKOFF §6's 21 lifecycle steps are grouped into 15 operating stages (`PROCESS_STAGES`), each with: the workbench route that serves it, the accountable personas, the objects worked there, and explicit exit criteria. Two stages (`platform`, `ai-ops`) are always-on.
2. **Object lifecycle mapping** — every business object's lifecycle states are mapped to the governed action that advances them (`STATE_ACTIONS`): e.g. `ScopeCandidate: submitted/challenged → scope.decide`, `MaterialDemand: shortage → material.reserve | material.request_pr`, `LaborEntry: submitted → labor.post_cats`, `PermitProxy: suspended → permit.request_correction` (never a WCM write). Each mapping carries a field-prefill contract so the trigger opens a ready-to-review draft, not an empty form.
3. **Persona day-in-the-life** — a work-queue engine (`workQueueForUser`) joins three sources per persona: (a) canonical transactions in `pending_approval` where the persona is an eligible approver and not the submitter (SoD), (b) live objects sitting in a state the persona's role must act on, (c) AI review packages addressed to that role. This is the **My Work** screen — the answer to "what must I do right now".
4. **Situational awareness** — the process ribbon on every screen shows event position (done / active / pending per stage, driven by the event phase) plus live open-item counts per stage (undecided scope, shortages, suspended permits, submitted time, RTS blockers, DLQ…), each chip navigating to the owning workbench.

## Stage → screen → persona → object → action

| # | Stage (KICKOFF steps) | Screen | Lead personas | Objects worked | Key action triggers | Exit criteria |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Portfolio & Premise (1–3) | /portfolio | sponsor, STO mgr | TurnaroundEvent, gates, budget | event.create, premise.approve | premise + strategy approved, budget released |
| 2 | Scope Intake→Freeze (4–6) | /scope | scope board, reliability, planner | ScopeCandidate, APM recs, emergent | scope.decide, scope.create_notification, scope.freeze | all candidates decided w/ reasons; frozen |
| 3 | Orders & Work Packages (7–8) | /work-packages | planner, WP owner | WP, SAP order/operations | wp.validate, wp.release | WP360 9/9 ready, released |
| 4 | Materials Readiness (9) | /materials | material planner, procurement, warehouse | MaterialDemand, ReservationProxy | material.reserve, material.request_pr, material.issue | no critical shortages, reservations posted |
| 5 | Contractors & Commercial (10) | /contractors | contractor coord, finance | roster, claims, SES | claim.decide, ses.prepare | crews badged, claims current |
| 6 | Cost Baseline (11) | /cost | finance, sponsor | forecast, commitments | forecast.submit_change, accrual.post | forecast approved, drivers owned |
| 7 | Schedule & Constraints (12) | /schedule | scheduler | P6 mirror, constraints | constraint.create/close, schedule.rebaseline | baseline linked, constraints owned |
| 8 | WCM & Area Risk (13–14) | /permits, /area-risk | WCM authority, HSE | permits, isolations, SIMOPS | permit.request_correction, simops.assign_mitigation | clearances active, SIMOPS mitigated |
| 9 | Daily Execution (15–16) | /field | supervisors, technicians | OperationExecution, emergent, handover | progress.submit, operation.confirm, emergent.raise | daily progress confirmed to SAP |
| 10 | Time & Labor (17) | /labor-time | timekeeper, crew supervisor, payroll | LaborEntry, PayPeriod | labor.submit, labor.post_cats, payroll.release | time approved daily → CATS → payroll |
| 11 | QA & Turnover (18) | /qa | QA, turnover coord | punch, test packs, turnover | punch.create/close, turnover.approve | class-A closed w/ evidence, systems turned over |
| 12 | PSSR & RTS (19) | /startup-readiness | ops/startup authority | StartupReadiness, PSSR | startup.approve_rts (human only) | blockers cleared, RTS recorded |
| 13 | Closeout & Lessons (20) | /lessons | STO mgr, reliability | lessons, CAPA | lesson.capture, capa.approve, mdg.submit_change | lessons dispositioned, norms updated |
| 14 | Integration & Data Ops (21) | /resilience, /data-foundation | integration op, steward | outbox, DLQ, data products | tick, replay, reverse, dataproduct.certify | DLQ empty, products certified |
| 15 | AI Review & Governance (21) | /ai | AI owner + each authority | recommendations, runs | run agents; disposition packages | packages dispositioned by human authority |

## Example day-in-the-life traces (verified by tests/process.test.ts)

- **Material planner (Gus)**: My Work shows "Reserve Material: MAT-4714 x 6 — shortage blocks WP-1001" pre-filled from the demand (material, qty, plant, sloc, need-by, demand link) → submit → supervisor's My Work shows the approval → approve → outbox → SAP doc → read-back → demand flips to `reserved`, constraint can be closed.
- **Crew supervisor (Maria)**: My Work lists 3 submitted time entries → "Approve Crew Time → Post to CATS" pre-filled per entry → four-eyes approval → CATS document on the entry.
- **HSE reviewer (Freya)**: suspended permit PTW-88103 exposes exactly one trigger — Request Correction in WCM (the compliant path); a WCM write is structurally impossible.
- **Ops authority (Sam)**: RTS gate shows `startup.approve_rts` but validation blocks until class-A punch, PSSR and isolation restoration clear; the startup agent's cited review package routes to his My Work only.
- **Executive viewer (Elena)**: zero triggers anywhere — read-only persona sees status, drills, and audit, never buttons.

## Regression protection

`tests/process.test.ts` locks this in: stage coverage and live status, state-action ↔ action-catalog integrity, prefill correctness, role filtering on row triggers, SoD-filtered approval routing, and AI-review routing per human authority.
