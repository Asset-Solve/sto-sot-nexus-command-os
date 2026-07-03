# STO/SOT Nexus Market Enhancement Report

Date: 2026-07-02

Scope: duplicated the last working STO/SOT build into `C:\Users\asset\OneDrive\Asset Performance - Solution Tracker\Webapp\STO_SOT_Nexus_Command_OS` and enhanced only the duplicate. The original `STO_SOT_FB` build was not edited.

## Enhancement Summary

The duplicate now extends the transaction-first STO/SOT platform with market-leading capabilities reflected in the enhancement prompt and the end-to-end process image:

| Capability | New / enhanced implementation |
| --- | --- |
| Mobility apps, resource onboarding, training and compliance | `/mobility-readiness`; `WorkerReadinessProfile`, `ContractorOnboardingPacket`, `TrainingCredential`, `AccessBadge`, `MobileDeviceAssignment`; governed LMS remediation and onboarding evidence requests |
| Scope/FEL/readiness dashboards | `/fel-readiness`; `FELGate`, `ReadinessScore`, `ReadinessException`, `GateBlocker`; waiver, blocker assignment and evidence-based resolution |
| Electronic workpacks | enhanced `/work-packages`; `ElectronicWorkpack`, `WorkpackSection`, `JobStep`, `DocumentBundle`, `PermitRequirement`, `InspectionHoldPoint`; DMS revision request path |
| Materials, tools and logistics | enhanced `/materials`; `StagingKit`, `ToolDemand`, `EquipmentRental`, `ShortageCase`; substitute decision and tool reservation paths |
| Control of work | `/control-of-work`; `IsolationPlan`, `LOTOPackage`, `BlindListItem`, `GasTestEvidence`, safety exceptions; fail-closed preplanning request routed to WCM authority |
| Execution excellence and RTLS | `/execution-map`; `DailyExecutionPlan`, `CrewAssignment`, `DispatchPacket`, `MobileScheduleUpdate`, `ProgressUpdate`, `LocationRiskAlert`, `ZoneOccupancy`; plan publish, progress acceptance and location-risk mitigation |
| Contract performance | `/contract-performance`; `ContractPerformanceSnapshot`, `InvoiceScheduleVariance`, SES and claims; invoice variance reconciliation |
| Cost reconciliation | `/cost-reconciliation`; `CostReconciliationCase`, `AccrualEstimate`, `EarnedValueRecord`, `ForecastChange`; governed SAP FI/CO accrual posting |
| Analytics | `/analytics`; `KPITrace`, `PerformanceInsight`, `ExceptionToAction`; KPI exceptions become work items, not passive dashboard counts |

## Connector Additions

Added native-ready connector definitions using the same platform connector contract:

| Connector | Purpose | Write posture |
| --- | --- | --- |
| `sap-ssam-mobile` | SAP Service and Asset Manager mobile work order/sync packets | Stage-only |
| `sap-fsm-dispatch` | SAP Field Service Management dispatch/service calls | Approval required |
| `lms-training` | LMS credential remediation and training assignments | Stage-only |
| `iam-access` | Badge and access control readiness | Stage-only |
| `opentext-dms` | OpenText/Documentum engineering document control | Stage-only |

Existing SAP-native connectors remain in place for EAM, MM, SES, CATS, FI/CO Journal Entry, WCM, DMS, APM, BDC/Datasphere, MDG, Fieldglass and P6.

## Process Backbone Updates

`src/server/domain/process.ts` now includes the enhanced object families in the lifecycle:

- Contractor mobilization now counts onboarding and training blockers.
- Materials now counts tool, kit and shortage cases.
- Safety now counts permit requirements, expired gas tests and RTLS location alerts.
- Execution now counts daily plans and submitted progress updates.
- Cost now counts invoice variance, reconciliation cases and accrual estimates.

New state-action mappings create prefilled governed drafts from object states including expired credentials, missing onboarding evidence, blocked FEL gates, open readiness exceptions, stale document bundles, material shortages, unavailable tools, missing permit requirements, draft daily plans, submitted progress updates, RTLS alerts, invoice variances, accrual proposals and KPI exceptions.

## Validation Evidence

Executed from `build/sto-platform`:

```text
npm install
npm run validate
```

Result:

```text
Type generation: passed
TypeScript: passed
Vitest: 3 files, 43 tests passed
Next.js production build: passed
```

Runtime route/API smoke on `http://127.0.0.1:3401`:

```text
/command-center 200
/my-work 200
/mobility-readiness 200
/fel-readiness 200
/work-packages 200
/materials 200
/control-of-work 200
/execution-map 200
/contract-performance 200
/cost-reconciliation 200
/analytics 200
/integration-hub 200
/api/bootstrap 200
/api/process 200
/api/objects/TrainingCredential 200
/api/objects/FELGate 200
/api/objects/ToolDemand 200
/api/objects/LocationRiskAlert 200
/api/objects/CostReconciliationCase 200
/api/lookups/connectors 200
```

Governed HTTP workflow smoke:

```text
u-contr submitted training.assign_refresher for TC-W2001-HOT -> pending_approval
u-hse approved -> staged connector package
TrainingCredential TC-W2001-HOT -> refresher_assigned
```

Note: the in-app browser automation surface timed out during navigation, but direct HTTP route/API validation against the running local server succeeded. The local Nexus server is running on port `3401`.

## Local Links

- Web: `http://127.0.0.1:3401/command-center`
- My Work: `http://127.0.0.1:3401/my-work`
- Mobility Readiness: `http://127.0.0.1:3401/mobility-readiness`
- FEL Readiness: `http://127.0.0.1:3401/fel-readiness`
- Control of Work: `http://127.0.0.1:3401/control-of-work`
- RTLS Execution Map: `http://127.0.0.1:3401/execution-map`
- Contract Performance: `http://127.0.0.1:3401/contract-performance`
- Cost Reconciliation: `http://127.0.0.1:3401/cost-reconciliation`
- Analytics: `http://127.0.0.1:3401/analytics`
- API Bootstrap: `http://127.0.0.1:3401/api/bootstrap`
- API Process Backbone: `http://127.0.0.1:3401/api/process`
