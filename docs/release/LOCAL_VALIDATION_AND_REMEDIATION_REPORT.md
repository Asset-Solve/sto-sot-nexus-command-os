# Local Validation and Remediation Report — STO/SOT Platform v1

Date: 2026-07-01 · Updated: 2026-07-02 process-first remediation pass · Scope: `build/sto-platform` (new application) + documentation deliverables.

## Gap matrix vs KICKOFF_PROMPT (Stage 03 audit)

Starting state: prompt pack only — **no application code existed** (no `build/` directory). Every capability in KICKOFF §8–§24 was net-new. Delivered in this build:

| KICKOFF area | Status |
| --- | --- |
| §8 workbenches (20 routes incl. aliases) | ✅ implemented (contract-driven framework + 4 custom consoles) |
| §9 canonical object catalog + envelope fields | ✅ core families seeded; envelope enforced on every object |
| §10/§24.3 SAP + non-SAP connector mapping | ✅ 22 object-specific connectors with §24.2 contract |
| §11 connector-backed lookups + dependent filtering | ✅ 25+ categories, source metadata, posting eligibility |
| §12 canonical transaction + 3 lifecycles | ✅ verbatim state machines |
| §13 posting-path decision engine | ✅ single pure function, tested |
| §14 workflow/approval/SoD | ✅ four-eyes server-side, approver roles, reasons |
| §15 architecture layering | ✅ monolith with production seams (worker/DB/API split documented) |
| §16 UI/UX (dark dense console, source badges, payload drawer, audit timeline) | ✅ |
| §17 AI governance + model routing + citations | ✅ 12 agents, policy gateway, blocked-action proof |
| Voice-interactive AI commands (user requirement) | ✅ Web Speech + governed intent service |
| §18 e2e demo workflow | ✅ demo script in README; e2e browser automation pending |
| §19/§24.12 test coverage | ✅ 24-case governance suite |
| §20/§24.11 documentation | ✅ this release set (SoR register, connector catalog, approval catalog, screen catalog, AI implementation, runbook, testing strategy) |
| §24.6 connector certification to SANDBOX/LIVE | ⏳ requires client tenant metadata (§24.13) — simulator certified |

## Validation commands

From `build/sto-platform/`:

```
npm install
npm audit --audit-level=moderate
npm run typecheck   # next typegen + tsc --noEmit
npm run test        # vitest governance suite (24 cases)
npm run build       # next build
npm run validate    # all of the above
```

## Executed remediation evidence

Runtime and validation were executed locally after remediation:

| Check | Result |
| --- | --- |
| `npm install` | ✅ completed |
| `npm audit --audit-level=moderate` | ✅ 0 vulnerabilities |
| `npm run typecheck` | ✅ Next route type generation + TypeScript passed |
| `npm run test` | ✅ Vitest 4.1.9 governance suite passed, 24/24 tests |
| `npm run build` | ✅ Next.js 16.2.10 production build passed, 38 static pages + API routes |
| `npm run validate` | ✅ passed end to end after the `/integration-hub` alias, 38 static pages + API routes |
| Browser smoke | ✅ `/command-center` and `/integration-hub` rendered with no captured console errors |
| HTTP integration smoke | ✅ `material.reserve` preview used `API_RESERVATION_DOCUMENT_SRV`; material planner submit → supervisor approval → simulated SAP doc `0002100001` → `MATCHED` reconciliation |
| Sandbox prerequisite validation | ✅ `winget`, WSL, Docker, Docker Compose, and Vagrant passed |
| Docker sandbox startup | ✅ `infra/sandbox/scripts/start-sandbox.ps1` started the sandbox stack |
| Docker sandbox health validation | ✅ SAP S/4, Oracle Fusion, SAP Integration Suite, OIC, Maximo, ServiceNow, PI Web API, OPC UA, Keycloak, and Postgres seed-count checks passed |

Remediations applied:

- Upgraded runtime dependencies from the original vulnerable baseline to `next@16.2.10`, `vitest@4.1.9`, `@types/node@24.10.0`.
- Added a package override for `postcss@8.5.16`; `npm audit --audit-level=moderate` now reports 0 vulnerabilities.
- Removed the deprecated `eslint` key from `next.config.mjs` for Next.js 16 compatibility.
- Updated dynamic API route handlers to await `params` in `app/api/lookups/[category]` and `app/api/objects/[type]`, matching the Next.js 16 App Router contract.
- Added `/integration-hub` as a compatibility alias to the Integration Hub (`/connectors`) to prevent stale links from prior STO/SOT builds from throwing 404.
- Updated `npm run typecheck` to run `next typegen` before `tsc --noEmit`, so validation also works from a fresh clone without pre-existing `.next` route type artifacts.
- Updated documentation from the original sandbox caveat to executable validation evidence.

## Known scope boundaries (deliberate, documented)

- Persistence is an in-process repository (production seam: PostgreSQL + RLS). Data resets on restart — correct for SIMULATOR mode.
- Persona switcher simulates the IdP session; production binds XSUAA/IAS/Entra.
- Agent analysis is deterministic over read models (offline-safe); hosted model calls plug into `AgentDef.run` without governance changes.
- SANDBOX/LIVE adapters are contract-identical but not yet bound; promotion is gated by the BTP runbook + certification evidence.

## Release decision

SIMULATOR-mode release: **approved for demo/UAT**. Local Docker sandbox infrastructure is running and health-validated for simulator integration testing. SANDBOX/LIVE promotion to client systems remains blocked pending §24.13 tenant metadata, BTP destination values, security certificates, and connector certification evidence.

---

## v1.1 — Transactional / process-first enhancement (2026-07-02)

**Critical flaw addressed:** screens read as dashboards — actions sat in a detached toolbar, and users could not see where objects sat in the turnaround process or what they were supposed to do next.

**Approach:** derived a machine-readable process backbone from KICKOFF §6 (21 steps → 15 operating stages) and an object-state → action matrix, then drove the entire UX from it. Design record: `docs/domain/STO_PROCESS_ACTIVITY_MAP.md`; implementation: `src/server/domain/process.ts`.

Delivered:

| Change | Where |
| --- | --- |
| Process backbone: 15 stages (route, personas, objects, exit criteria) + object-state → action matrix with field prefill + persona work-queue engine | `src/server/domain/process.ts`, `/api/process`, `/api/my-work` |
| **My Work** workbench: approvals waiting on me (SoD-filtered), process actions in my court (deep-link to prefilled governed drafts), AI reviews for my role; inline approve/reject | `src/app/my-work/page.tsx`, nav + voice ("my work") |
| Lifecycle ribbon on every screen: event position per stage + live open-item counts, click-through to owning workbench | `src/components/ProcessRibbon.tsx` |
| State-aware row actions: each list row shows only the governed actions valid for that object's current lifecycle state and the user's role, opening pre-filled drawers ("Act now" column) | `src/components/Workbench.tsx` |
| "What happens next" panel per selected object, including actions gated to other roles | `src/components/Workbench.tsx` |
| New advisory action `constraint.close`; role-disabled toolbar buttons with required-role tooltips | `src/server/domain/registry.ts`, Workbench |
| Process regression tests: stage coverage/status, matrix↔catalog integrity, prefill correctness, role-filtered triggers, SoD-filtered approval routing, AI-review routing | `tests/process.test.ts` |

**Validation executed on 2026-07-02:**

| Check | Result |
| --- | --- |
| `npm audit --audit-level=moderate` | ✅ 0 vulnerabilities |
| `npm run validate` | ✅ `next typegen && tsc --noEmit`, Vitest, and `next build` passed |
| Vitest regression | ✅ 2 files, 35/35 tests passed, including process-stage coverage and MAT-4714 prefill correctness |
| Production build | ✅ Next.js 16.2.10 build passed; `/my-work`, `/api/my-work`, `/api/process`, `/integration-hub` included |
| Link smoke | ✅ `/command-center`, `/integration-hub` (redirects to `/connectors`), `/api/bootstrap`, `/my-work`, `/api/process` returned 200 |
| Browser smoke | ✅ Command Center, Integration Hub alias, My Work, and the MAT-4714 draft opened with no captured console errors |
| Governed write smoke | ✅ Gus Weber (`u-matl`) submitted MAT-4714 reservation; Kate Brody (`u-super`) approved; simulator returned SAP reservation `0002100001`; transaction reconciled `MATCHED` |

**Additional remediation found during validation:** the process action prefilled material, quantity, plant, storage location, need-by date and work package, but the governed SAP reservation also requires receiver order. `MaterialDemand` seed data now carries `orderId`, the object-state matrix maps `orderId` into `material.reserve`, and `tests/process.test.ts` asserts MD-002 prefill includes `ORD-4000101`.

---

## v1.2 — Nexus Market-Leading Enhancement Duplicate (2026-07-02)

This pass was completed in the new duplicate repo `STO_SOT_Nexus_Command_OS`; the last working `STO_SOT_FB` build was not edited.

Delivered:

| Area | Result |
| --- | --- |
| New workbenches | `/mobility-readiness`, `/fel-readiness`, `/control-of-work`, `/execution-map`, `/contract-performance`, `/cost-reconciliation`, `/analytics` |
| New connector definitions | SAP SSAM, SAP FSM, LMS training, access/badge, OpenText/Documentum DMS |
| New object families | workforce readiness, onboarding, credentials, FEL gates, readiness exceptions, e-workpacks, tool demand, staging kits, isolation/LOTO/blinds/gas tests, daily plans, RTLS alerts, invoice variance, accruals, earned value, KPI traceability |
| New governed actions | refresher training, onboarding evidence request, blocker assignment, waiver request, readiness resolution, DMS revision request, material substitute, tool reservation, permit/isolation preplan, location alert acknowledgement, daily plan publish, progress acceptance, invoice reconciliation, cost case resolution, SAP FI/CO accrual posting, analytics-to-action |
| Process backbone | stage counts and My Work queues now include the new blockers and role-owned actions |
| Regression tests | Added `tests/market-enhancement.test.ts`; suite now has 43 passing tests |

Validation:

| Check | Result |
| --- | --- |
| `npm install` | passed, 0 vulnerabilities |
| `npm run validate` | passed |
| Vitest | 3 files, 43/43 tests passed |
| Production build | passed, new routes included |
| HTTP route smoke on port 3401 | all key routes returned 200 |
| HTTP API smoke on port 3401 | process, bootstrap, object and connector lookup APIs returned 200 |
| Governed HTTP workflow smoke | contractor coordinator submitted LMS refresher; HSE approved; credential state changed to `refresher_assigned` |

Local validation links:

- `http://127.0.0.1:3401/command-center`
- `http://127.0.0.1:3401/my-work`
- `http://127.0.0.1:3401/mobility-readiness`
- `http://127.0.0.1:3401/fel-readiness`
- `http://127.0.0.1:3401/control-of-work`
- `http://127.0.0.1:3401/execution-map`
- `http://127.0.0.1:3401/contract-performance`
- `http://127.0.0.1:3401/cost-reconciliation`
- `http://127.0.0.1:3401/analytics`

---

## v1.3 — SAP-Native Actionability Remediation (2026-07-02)

**Critical flaw addressed:** workbenches had rich SAP-like read models but some screens still felt like dashboards because rows did not expose enough native SAP business triggers. Users would still need SAP GUI/Fiori for common STO execution actions such as order operations/components, material quantity changes, permit preplanning, order status changes, evidence attachment and mobile dispatch.

Delivered:

| Area | Result |
| --- | --- |
| Workbench action visibility | Row actions now show the state-valid SAP action even when the current persona cannot execute it, disabled with required-role tooltip, so the screen explains the process handoff instead of hiding it. |
| SAP EAM order actions | Added governed `scope.create_order`, `order.add_operation`, `order.add_component`, `order.change_component_qty`, `order.reschedule`, `order.set_status`, `order.attach_evidence`. |
| SAP MM/material actions | Added governed `reservation.change_quantity` and `material.return`; retained reservation create, PR request and goods issue. |
| WCM/ePTW safety path | `permit.request_preplan` now anchors to work package and/or SAP maintenance order, produces a WCM/ePTW preplan payload, and still blocks direct permit status writes. |
| SSAM/FSM execution path | Released work packages can be staged to mobile execution via `mobile.dispatch_package`, with visible staged-not-posted state until connector certification. |
| Seed/read models | Added SAP order component rows, a reservation read-model row and a goods movement row so Work Packages and Materials have actionable SAP objects. |
| Process backbone | Object-state matrix now routes SAP order, operation, component, reservation, WCM and mobile rows into row actions and My Work queues. |
| Documentation | Added `docs/integration/SAP_NATIVE_ACTIONABILITY_MAP.md` with screen/action/object/connector/API mapping. |
| Regression tests | Added `tests/sap-actionability.test.ts`; suite now has 50 passing tests. |

SAP native-ready connector grounding:

| Business action | Connector/API path |
| --- | --- |
| Create/update maintenance order, operation, component, order status/date | `sap-eam-order` / `API_MAINTENANCEORDER_0002` |
| Create/update reservation | `sap-mm-reservation` / `API_RESERVATION_DOCUMENT_SRV` |
| Goods issue/return | `sap-mm-matdoc` / `API_MATERIAL_DOCUMENT_SRV` |
| Attach evidence to order | `sap-dms` / `API_CV_ATTACHMENT_SRV` |
| WCM/ePTW preplan/correction package | `sap-wcm` or `eptw` via Integration Suite wrapper, fail-closed for direct status writes |
| Mobile dispatch package | `sap-ssam-mobile` / `SSAM_MOBILE_SYNC` staged package; SAP FSM connector-ready alternative |

Validation executed:

| Check | Result |
| --- | --- |
| `npm audit --audit-level=moderate` | passed, 0 vulnerabilities |
| `npm run validate` | passed |
| Typecheck | passed (`next typegen && tsc --noEmit`) |
| Vitest | passed, 4 files, 50/50 tests |
| Production build | passed, Next.js 16.2.10 |
| HTTP route smoke | `/command-center`, `/work-packages`, `/materials`, `/control-of-work`, `/execution-map`, `/my-work`, `/integration-hub`, `/api/process`, `/api/actions` returned 200 on port 3401 |
| API action smoke | `/api/process` and `/api/actions` contain `scope.create_order`, `order.add_component`, `order.change_component_qty`, `reservation.change_quantity`, `material.return`, `mobile.dispatch_package` |
| Governed HTTP write smoke | Material planner submitted `reservation.change_quantity`; maintenance supervisor approved; simulator returned SAP reservation document `0002100001`; read-back reconciliation `MATCHED` |
| Browser render smoke | Playwright rendered `/materials` and `/work-packages`; source badges and actionability content present; no console errors |

Local validation links:

- `http://127.0.0.1:3401/command-center`
- `http://127.0.0.1:3401/work-packages`
- `http://127.0.0.1:3401/materials`
- `http://127.0.0.1:3401/control-of-work`
- `http://127.0.0.1:3401/execution-map`
- `http://127.0.0.1:3401/my-work`
- `http://127.0.0.1:3401/api/process`
