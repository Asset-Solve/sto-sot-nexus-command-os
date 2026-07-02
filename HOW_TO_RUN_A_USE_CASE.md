# How To Run A Use Case — End-to-End Operator Guide

This is the step-by-step guide for the one thing you do: **feed a use case and
drive it to a built application through gated stages.** It tells you exactly what
to type, what the engine does, and where *you* have to take an action.

> **Two ways to run this pack — pick one (you can switch mid-build):**
> - **Track A — the Python engine (this document).** Deterministic CLI; gates are
>   enforced programmatically. Best for repeatable, auditable, team/CI use.
> - **Track B — a project chat or folder.** Paste the use case + key pack files
>   into an AI project (Claude Project, a Cowork folder, ChatGPT/Codex, Claude
>   Code) and it walks the stages conversationally, stopping at each gate for your
>   approval. No Python. See **`RUN_IN_A_PROJECT_CHAT.md`** + **`KICKOFF_PROMPT.md`**.
>
> Both tracks use the same use case, the same 21 stages, and the same gate
> discipline; they differ only in *how* the stages are driven.

Windows commands below use the local virtual environment
(`.\.venv\Scripts\python.exe`). On macOS/Linux use `python` instead. Everything
runs from the pack folder:

```
cd "enterprise_ai_erp_prompt_pack_v2"
```

---

## 0. The whole loop in six lines

```powershell
# 1. give ONE input — the use case — and start a guided build
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "….your use case…"
# 2. the engine runs Stage 00, checks the gate, writes a report, and pauses
# 3. you read docs\governance\gate-reports\STAGE_00_GATE_REPORT.md
# 4. you approve  ->  type  a   (or run: run.py --approve 00 ; run.py --resume)
# 5. repeat for Stage 01, 02, … 20  (approve / revise / stop at each)
# 6. after Stage 20 you have a release decision + evidence pack
```

That is the entire operating model: **you supply the use case and a yes/no at
each gate; the engine does the rest and never crosses a gate without you.**

---

## 1. What you feed — the ONE input (the use case)

The only required input is a **use case**: one short paragraph describing what
business capability you want as an application. The richer it is, the fewer
questions the engine has to stop and ask.

A strong use case answers eight things (these map 1:1 to
`schemas/use-case-intake.schema.json`, which the Stage 01 gate validates):

| # | What to state | Example |
| --- | --- | --- |
| 1 | **Use case** — the capability in one line | "A work-order execution cockpit for maintenance technicians." |
| 2 | **Business outcome** — the measurable value | "Cut work-order cycle time and rework by giving technicians a guided, connected workbench." |
| 3 | **Personas** — who uses it | "Maintenance technician, maintenance planner, supervisor." |
| 4 | **Process scope** — the boundary | "From work-order dispatch through operation confirmation and technical completion." |
| 5 | **Systems touched** — the systems of record | "SAP S/4HANA Plant Maintenance (PM); attachments in SharePoint." |
| 6 | **Expected write-backs** — what it changes in those systems | "Operation confirmations (time + measurements), status changes, goods movements." |
| 7 | **Risk class** — how controlled the writes are | "Controlled side-effects — postings to SAP; no autonomous AI posting." |
| 8 | **Known assumptions / open questions** | "Assume S/4HANA public cloud; open: which plants are in scope?" |

You do **not** have to write all eight — the engine infers sensible defaults and
records them as assumptions. But stating 1, 4, 5, and 6 explicitly saves the most
back-and-forth.

### Good vs weak use case

- **Weak:** "Build a maintenance app." → the engine will stop early with many
  blocking questions (no systems, no write-backs, no scope).
- **Good:** "A work-order execution cockpit for SAP PM maintenance technicians and
  planners, covering dispatch → operation confirmation → technical completion.
  It reads equipment, functional locations and maintenance orders from SAP
  S/4HANA PM, and writes back operation confirmations, status changes and goods
  movements. Controlled side-effects — all SAP postings go through approval and
  outbox; AI drafts and never posts autonomously. Assume S/4HANA public cloud."

### Two ways to feed it

Short use case — inline:

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "….the paragraph above…"
```

Longer use case — put it in a file (recommended; easier to edit and re-use):

```powershell
# create my_use_case.md with your paragraph, then:
.\.venv\Scripts\python.exe orchestrator\run.py --use-case-file my_use_case.md
```

### Optional switches (only if you want to override defaults)

| Switch | Default | Use it to… |
| --- | --- | --- |
| `--mode` | `guided_gates` | change how it pauses (see §5) |
| `--driver` | `auto` | force `codex`, `claude`, or `dryrun` |
| `--stack` | `typescript` | target `java` or `agnostic` instead |
| `--workspace` | `.\build` | choose where the generated app code goes |

The use case is the only thing you *must* provide. Everything else has a default.

---

## 2. One-time setup

Do this once per machine.

```powershell
cd "enterprise_ai_erp_prompt_pack_v2"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r orchestrator\requirements.txt
.\.venv\Scripts\python.exe tools\sync_from_v1.py     # completes the pack (first run auto-does this too)
```

Then decide which of two ways you want to run:

- **Offline preview (no keys):** `--driver dryrun`. The engine simulates every
  agent so you can see the whole flow, the gates, and the reports without any AI
  calls. Great for learning the loop and for demos. It does **not** produce real
  content or real code.
- **Real build (needs keys):** `--driver auto` (default). The engine calls Codex
  and Claude to actually produce the artifacts and code. Install the CLIs and set
  keys first:

```powershell
npm install -g @openai/codex @anthropic-ai/claude-code
$env:CODEX_API_KEY="…"        # or OPENAI_API_KEY
$env:ANTHROPIC_API_KEY="…"
```

Real runs that write code also require `--allow-writes` (a safety switch so a
mis-run can never touch a live ERP).

---

## 3. What happens end to end (the 21 stages)

When you feed a use case, the engine walks stages **00 → 20**. Each stage:
generates its artifacts → runs a **programmatic gate** → writes a gate report →
**pauses for you** (in guided mode). Stages are grouped into six phases, and a
later phase cannot start until the earlier gates are approved.

| Phase | Stages | What the engine produces | The decision that is YOURS |
| --- | --- | --- | --- |
| **Discovery** | 00–03 | Build-rules ack, use-case intake, market + fit-to-standard research, current-state audit | Is the problem framed right? Is an extension justified vs standard SAP/Oracle? |
| **Domain** | 04–05 | Capability model, process decomposition (incl. exception/reversal paths) | Do capabilities map to real outcomes and owners? |
| **Data** | 06–07 | Master/transaction/reference/audit data model, **source-of-record register** | Who owns each field? Is anything ERP-owned being treated as local? |
| **Integration** | 08–09 | Native integration matrix, connector catalog | Is every write-back **proven** on a native/released API, or is there a fallback ADR? |
| **Transaction & workflow** | 10–12 | Canonical transaction + posting path, workflow/approval/SoD, screen contracts | Are approvals, SoD, outbox, read-back, reconciliation first-class? |
| **Build** | 13–17 | Repo skeleton, backend foundation, connector-backed lookups, transaction services, guided UI | Do tests actually pass? No fake buttons / hard-coded dropdowns? |
| **AI + release** | 18–20 | AI backbone (grounded, non-autonomous), production readiness, **release decision + evidence** | Go / Go-with-exceptions / No-go? |

Where things land:

- **Artifacts** (docs/specs) → `docs\…` inside the pack.
- **Generated application code** → your `--workspace` (default `.\build`).
- **Gate reports** → `docs\governance\gate-reports\STAGE_NN_GATE_REPORT.md`.
- **Run state** → `orchestrator\state\run-state.json` (progress, approvals).

---

## 4. Your actions at each gate (the human-in-the-loop)

After every stage the engine writes a gate report and stops. Your job is to read
it and decide. There are two interaction styles — pick whichever you like.

### Style A — interactive prompt (simplest)

Run `run.py` in your terminal. When a gate passes, it asks:

```
Approve stage 07 and proceed? [a=approve / r=revise / s=stop]:
```

- Type **`a`** → approves and immediately continues to the next stage.
- Type **`r`** → marks the stage for revision and stops.
- Type **`s`** → stops so you can come back later.

### Style B — approve/resume (scriptable, good for long stages)

Run with `--non-interactive`. The engine stops after each passing gate and prints
the exact commands. You review the report, then:

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --approve 07
.\.venv\Scripts\python.exe orchestrator\run.py --resume
```

### What each gate report tells you

- **Decision** (proceed / revise / stop) and a confidence level.
- **Automated checks** — what the engine verified for you (artifacts present,
  schemas valid, no hard-coded dropdowns / fake buttons / direct-ERP calls, ERP
  stop-conditions satisfied, tests passed).
- **Risks / open findings** — anything that failed or warns.
- **Recommendation** + the exact approve/resume command.

### When you should NOT just approve

The gates the engine cannot fully judge for you — read these reports carefully:

- **Stage 02 (fit-to-standard):** confirm you are *extending* SAP/Oracle, not
  rebuilding what they already do.
- **Stage 07 (source-of-record):** confirm every controlled field has a real
  owner and write policy.
- **Stage 08 (integration):** confirm each write-back is proven on a
  native/released API (or has an approved fallback ADR).
- **Stage 11 (workflow/approval):** confirm SoD / four-eyes on controlled actions.
- **Stage 18 (AI):** confirm AI is grounded, cited, and **cannot post
  autonomously**.
- **Stage 20 (release):** the final Go / Go-with-exceptions / No-go is yours.

### If a gate FAILS (hard stop)

The engine stops and names the findings. Fix them, then re-run just that stage:

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --stage 08 --mode repair
```

### Answering the engine's blocking questions

Stage 01 records assumptions and any **blocking** open questions in
`docs\domain\ASSUMPTIONS_AND_OPEN_QUESTIONS.md` and the Stage 01 report. To
answer them, either add the answers to your use case and re-run Stage 01
(`--stage 01 --mode repair`), or edit that file directly, then approve. Non-
blocking assumptions don't stop the flow — they're just recorded for you to
confirm.

---

## 5. Run playbooks

### A. Offline preview — see the machinery, no keys

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "Purchase-requisition approval cockpit for SAP MM" --driver dryrun --mode full_auto_draft --yes
.\.venv\Scripts\python.exe orchestrator\gates\validate.py        # inspect every gate
```

### B. Real guided build — the main way (recommended)

```powershell
# keys set (see §2). Starts guided; you approve each gate.
.\.venv\Scripts\python.exe orchestrator\run.py --use-case-file my_use_case.md --allow-writes
# …approve each stage with 'a', or use --approve NN / --resume…
```

### C. Full-auto draft — generate everything, then review

Generates all stages without pausing, but still **hard-stops on any failed gate**.
Use it to get a complete first draft fast, then review the reports.

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --use-case-file my_use_case.md --mode full_auto_draft --yes --allow-writes
```

### D. Everyday controls

```powershell
.\.venv\Scripts\python.exe orchestrator\run.py --status            # where am I?
.\.venv\Scripts\python.exe orchestrator\run.py --resume            # continue
.\.venv\Scripts\python.exe orchestrator\run.py --stage 16 --mode repair   # redo one stage
.\.venv\Scripts\python.exe orchestrator\run.py --reset             # clear state, start a new use case
```

### E. Running several use cases

One run tracks one use case at a time (state lives in
`orchestrator\state\run-state.json`). To start a different use case, either:

- finish/`--reset` the current one, then feed the next `--use-case…`, or
- keep them fully separate by copying the pack folder per use case (each copy has
  its own state and its own `.\build`).

---

## 6. Worked example — first two gates

```powershell
# 1) feed the use case (guided)
.\.venv\Scripts\python.exe orchestrator\run.py --use-case "A work-order execution cockpit for SAP PM technicians and planners: dispatch -> operation confirmation -> technical completion; reads equipment/functional-location/maintenance-order from SAP S/4HANA PM; writes operation confirmations, status changes, goods movements; controlled side-effects, no autonomous AI posting; assume S/4HANA public cloud."
```

The engine runs **Stage 00** (build rules), passes the gate, writes
`docs\governance\gate-reports\STAGE_00_GATE_REPORT.md`, and asks:
`Approve stage 00 and proceed? [a/r/s]`. You skim the report → type **`a`**.

It runs **Stage 01** (intake), validates your inputs against the intake schema,
lists any blocking questions in the report, and pauses again. You answer any
blocking question (edit the assumptions file or refine the use case), then type
**`a`**. It proceeds to Stage 02 research — and so on to Stage 20.

At the end you have, in the pack: the full artifact set under `docs\`, the app
code under `.\build`, a gate report per stage, and
`docs\release\RELEASE_DECISION.md`.

---

## 7. Command reference

| Command | What it does |
| --- | --- |
| `run.py --use-case "…"` | Start a guided build from a use case |
| `run.py --use-case-file f.md` | Same, reading the use case from a file |
| `run.py --resume` | Continue from the last approved gate |
| `run.py --approve NN` | Record your approval of stage NN's gate |
| `run.py --stage NN --mode repair` | Re-run a single stage |
| `run.py --status` | Show progress and approvals |
| `run.py --reset` | Clear run state to start a new use case |
| `run.py --driver dryrun` | Simulate offline (no keys) |
| `run.py --mode full_auto_draft --yes` | Draft all stages without pausing |
| `run.py --allow-writes` | Permit live agents to write code |
| `gates\validate.py` | Re-run all gate checks and print results |
| `tools\lint_pack.py` | Parse all yaml/json + marker scan |

---

## 8. Troubleshooting

- **"provide the use case with --use-case…"** — you started without an input and
  there's no prior run. Pass `--use-case` or `--use-case-file`.
- **"driver 'claude'/'codex' unavailable"** — install the CLI and set the API key
  (§2), or use `--driver dryrun` to preview offline.
- **A gate keeps failing** — open its report under
  `docs\governance\gate-reports\`, fix the named finding (or add a justified
  ADR/exemption), then `--stage NN --mode repair`.
- **I want to start over** — `run.py --reset` (clears state; your artifacts stay
  on disk until overwritten).
- **Tests show as "skip"** — gate tests only execute with `--run-tests` against a
  generated workspace; in dry-run they are skipped by design.

---

### The one-sentence version

Put your capability into one paragraph, run `run.py --use-case "…"`, and press
**`a`** at each gate you're happy with — the engine turns that single input into
a gated, SAP/Oracle-ready application and stops for you at every layer.
