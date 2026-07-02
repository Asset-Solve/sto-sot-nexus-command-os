# Enterprise AI ERP build engine - convenience targets
# Give ONE input (a use case) and the engine drives the gated 00->20 build.
USE_CASE ?= Plant maintenance work-order cockpit integrated with SAP PM
DRIVER   ?= auto
STACK    ?= typescript
WORKSPACE ?= ./build
PYTHON ?= python

.PHONY: help install sync dryrun build resume status validate lint clean sandbox-prereqs sandbox-up sandbox-vm sandbox-validate sandbox-down

help:
	@echo "make install      # install engine deps (pyyaml, jsonschema)"
	@echo "make sync         # materialise unchanged files from the original pack into v2"
	@echo "make dryrun       # offline simulate the full 00->20 flow (no API keys)"
	@echo "make build        # real guided-gate build:  USE_CASE=\"...\" make build"
	@echo "make resume       # continue from the last approved gate"
	@echo "make status       # show run state"
	@echo "make validate     # run all programmatic stage gates (dry, no test exec)"
	@echo "make lint         # scan for leftover markers + parse yaml/json"
	@echo "make clean        # reset run state"
	@echo "make sandbox-prereqs # install Docker, WSL, Ubuntu, Vagrant prerequisites"
	@echo "make sandbox-up   # start local ERP integration sandbox with Docker Compose"
	@echo "make sandbox-vm   # start sandbox VM via Vagrant"
	@echo "make sandbox-validate # validate sandbox health and seed data"
	@echo "make sandbox-down # stop local ERP integration sandbox"

install:
	$(PYTHON) -m pip install -r orchestrator/requirements.txt

sync:
	$(PYTHON) tools/sync_from_v1.py

dryrun:
	$(PYTHON) orchestrator/run.py --use-case "$(USE_CASE)" --driver dryrun --mode full_auto_draft --yes --workspace $(WORKSPACE)

build:
	$(PYTHON) orchestrator/run.py --use-case "$(USE_CASE)" --driver $(DRIVER) --stack $(STACK) --workspace $(WORKSPACE)

resume:
	$(PYTHON) orchestrator/run.py --resume

status:
	$(PYTHON) orchestrator/run.py --status

validate:
	$(PYTHON) orchestrator/gates/validate.py

lint:
	$(PYTHON) tools/lint_pack.py

clean:
	$(PYTHON) orchestrator/run.py --reset

sandbox-prereqs:
	powershell -ExecutionPolicy Bypass -File infra/sandbox/scripts/install-prereqs.ps1

sandbox-up:
	powershell -ExecutionPolicy Bypass -File infra/sandbox/scripts/start-sandbox.ps1

sandbox-vm:
	powershell -ExecutionPolicy Bypass -File infra/sandbox/scripts/start-sandbox.ps1 -Vm

sandbox-validate:
	powershell -ExecutionPolicy Bypass -File infra/sandbox/scripts/validate-sandbox.ps1

sandbox-down:
	powershell -ExecutionPolicy Bypass -File infra/sandbox/scripts/stop-sandbox.ps1
