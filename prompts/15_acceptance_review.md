# Prompt 15 - Interim Enterprise Acceptance Review

Use this prompt for interim acceptance reviews. Use `prompts/20_acceptance_release_evidence.md` for final release acceptance.

Perform end-to-end acceptance review:
- every field has source/target/validation/integration/audit
- every button calls backend
- every write uses payload preview/outbox/read-back/reconciliation/audit
- no hard-coded dropdowns
- no direct frontend ERP calls
- approvals and SoD work
- CI/CD gates pass
- production readiness gates pass
- AI evals pass

Create release decision: Go / Go with exceptions / No-go.
