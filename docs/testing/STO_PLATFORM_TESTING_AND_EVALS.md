# Testing and Eval Strategy — STO/SOT Platform (built app)

Commands (from `build/sto-platform/`): `npm run typecheck` · `npm run test` (vitest governance suite) · `npm run build` · `npm run validate` (all three). CI must gate merges on `validate`.

## Governance regression suite (tests/governance.test.ts)

| Control (KICKOFF §19 / §24.12) | Test |
| --- | --- |
| Lookup APIs return source metadata + posting eligibility | connector-backed lookups suite |
| Dependent dropdown filtering (order→operations, plant→units) | ✔ |
| Worker selection hydrates effective-dated defaults | ✔ |
| Posting-path decision routes correctly (AI, WCM, disabled, released-API) | ✔ 4 cases |
| Validation blocks missing required SAP fields | material.reserve case |
| Scope freeze blocks unresolved critical items | ✔ |
| WP release blocks missing readiness dimensions + suspended permits | ✔ |
| RTS approval blocked while blockers open | ✔ |
| WCM/permit write attempts fail closed + audited | ✔ |
| AI blocked action never executes + audited | ✔ |
| AI outputs carry citations, confidence, route, human authority | ✔ |
| Voice refuses safety approvals; drafts only, never executes | ✔ |
| RBAC denies out-of-contract roles | ✔ |
| SoD: submitter cannot approve own transaction | ✔ |
| Tenant isolation on transactions | ✔ |
| Idempotent resubmit returns same result | ✔ |
| Outbox retry → DLQ; replay needs role + reason; idempotent replay | ✔ |
| Read-back creates reconciliation record; doc number captured | ✔ |
| Reversal creates linked reversing transaction, original untouched | ✔ |
| Connector disabled → server-side staged write ("not posted" state) | ✔ |
| Audit captures submit/approve/post with actor, role, correlation | ✔ |

## Next tiers (before sandbox promotion)

Connector contract tests generated from imported EDMX/OpenAPI metadata (runbook step 9); Playwright e2e over the 26-step demo workflow; automated axe accessibility pass; AI scenario evals per agent (golden cases, citation/hallucination checks) before hosted models replace the deterministic rules; load tests on outbox worker and lookup APIs.
